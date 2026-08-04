const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../prisma');
const { OAuth2Client } = require('google-auth-library');
const UAParser = require('ua-parser-js');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '1035914529845-2era30kqp85erenh6v96lj81t52fncrv.apps.googleusercontent.com');

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = crypto.randomBytes(40).toString('hex');
  return { accessToken, refreshToken };
};

const createSession = async (user, req, res) => {
  const { accessToken, refreshToken } = generateTokens(user);
  
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.connection.remoteAddress || '';
  const parser = new UAParser(userAgent);
  const uaResult = parser.getResult();
  const uaString = `${uaResult.browser.name || 'Unknown'} on ${uaResult.os.name || 'Unknown'}`;

  // Check for suspicious activity (e.g. new IP that was never used by this user)
  let isSuspicious = false;
  const previousSessions = await prisma.session.findMany({
    where: { userId: user.id }
  });
  
  if (previousSessions.length > 0) {
    const knownIps = new Set(previousSessions.map(s => s.ipAddress).filter(Boolean));
    if (ipAddress && !knownIps.has(ipAddress)) {
      isSuspicious = true;
      console.warn(`Suspicious Login Detected: User ${user.email} logged in from a new IP: ${ipAddress}`);
    }
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      ipAddress,
      userAgent: uaString,
      isSuspicious,
      expiresAt
    }
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return accessToken;
};

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword }
    });

    const accessToken = await createSession(user, req, res);
    res.json({ token: accessToken, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

    const accessToken = await createSession(user, req, res);
    res.json({ token: accessToken, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || '1035914529845-2era30kqp85erenh6v96lj81t52fncrv.apps.googleusercontent.com',
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;
    
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { email },
          data: { googleId }
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId,
          password: null
        }
      });
    }
    
    const accessToken = await createSession(user, req, res);
    res.json({ token: accessToken, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Google authentication failed: ' + err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, googleId: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token provided' });

    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true }
    });

    if (!session || session.isRevoked || new Date() > session.expiresAt) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const accessToken = jwt.sign(
      { id: session.user.id, name: session.user.name, email: session.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Update session last active time
    await prisma.session.update({
      where: { id: session.id },
      data: { updatedAt: new Date() }
    });

    res.json({ token: accessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await prisma.session.update({
        where: { refreshToken },
        data: { isRevoked: true }
      }).catch(() => {}); // Ignore error if session doesn't exist
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id, isRevoked: false, expiresAt: { gt: new Date() } },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, ipAddress: true, userAgent: true, createdAt: true, updatedAt: true, isSuspicious: true }
    });
    
    // Tag the current session
    const { refreshToken } = req.cookies;
    let currentSession = null;
    if (refreshToken) {
      currentSession = await prisma.session.findUnique({ where: { refreshToken } });
    }
    
    const mappedSessions = sessions.map(s => ({
      ...s,
      isCurrent: currentSession && currentSession.id === s.id
    }));
    
    res.json(mappedSessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.revokeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await prisma.session.findUnique({ where: { id } });
    
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    await prisma.session.update({
      where: { id },
      data: { isRevoked: true }
    });
    
    res.json({ message: 'Session revoked successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
