const prisma = require('../prisma');

exports.getAll = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get documents owned by user
    const owned = await prisma.document.findMany({
      where: { ownerId: userId },
      include: { owner: { select: { name: true, email: true } } },
      orderBy: { updatedAt: 'desc' }
    });

    // Get documents shared with user
    const collabs = await prisma.collaborator.findMany({
      where: { userId },
      include: {
        document: {
          include: { owner: { select: { name: true, email: true } } }
        }
      },
      orderBy: { document: { updatedAt: 'desc' } }
    });
    
    const shared = collabs.filter(c => c.status === 'ACCEPTED').map(c => c.document);
    const pending = collabs.filter(c => c.status === 'PENDING').map(c => c.document);

    res.json({ owned, shared, pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title } = req.body;
    const document = await prisma.document.create({
      data: {
        title: title || 'Untitled document',
        ownerId: req.user.id,
      },
      include: { owner: { select: { name: true, email: true } } }
    });
    res.json(document);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: { select: { name: true, email: true } },
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        collaborators: {
          include: { user: { select: { name: true, email: true } } }
        },
        history: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!document) return res.status(404).json({ error: 'Document not found' });

    // Authorization check
    const userCollab = document.collaborators.find(c => c.userId === req.user.id);
    if (document.ownerId !== req.user.id) {
      if (userCollab && userCollab.status === 'PENDING') {
        return res.status(403).json({ error: 'Invite pending. Please accept the invitation first.', pending: true });
      }
      if (!userCollab) {
        // Auto-join for prototype purposes
        const collab = await prisma.collaborator.create({
          data: { documentId: id, userId: req.user.id, role: 'EDITOR', status: 'ACCEPTED' },
          include: { user: { select: { name: true, email: true } } }
        });
        document.collaborators.push(collab);
      }
    }

    res.json(document);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.rename = async (req, res) => {
  try {
    const { title } = req.body;
    const document = await prisma.document.update({
      where: { id: req.params.id },
      data: { title }
    });
    res.json(document);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDoc = async (req, res) => {
  try {
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.duplicate = async (req, res) => {
  try {
    const original = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!original) return res.status(404).json({ error: 'Not found' });

    const copy = await prisma.document.create({
      data: {
        title: `Copy of ${original.title}`,
        ownerId: req.user.id,
        content: original.content
      }
    });
    res.json(copy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addCollaborator = async (req, res) => {
  try {
    const { email, role } = req.body;
    const documentId = req.params.id;

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found' });
    }

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    
    if (doc.ownerId !== req.user.id) {
       return res.status(403).json({ error: 'Only the owner can add collaborators' });
    }

    const collab = await prisma.collaborator.upsert({
      where: {
        documentId_userId: { documentId, userId: userToAdd.id }
      },
      update: { role },
      create: { documentId, userId: userToAdd.id, role, status: 'PENDING' },
      include: { user: { select: { name: true, email: true } } }
    });

    // Simulate sending an email invite
    console.log(`\n=================================================`);
    console.log(`✉️  EMAIL SIMULATION: GitHub-style Invite`);
    console.log(`To: ${email}`);
    console.log(`Subject: You have been invited to collaborate!`);
    console.log(`Body: You've been invited to collaborate on a document as ${role}.`);
    console.log(`Please click the link below to accept the invitation:`);
    console.log(`➡️  http://localhost:5173/accept-invite/${documentId}`);
    console.log(`=================================================\n`);

    res.json(collab);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const documentId = req.params.id;
    const collab = await prisma.collaborator.findUnique({
      where: { documentId_userId: { documentId, userId: req.user.id } }
    });
    
    if (!collab) return res.status(404).json({ error: 'Invite not found' });
    
    const updated = await prisma.collaborator.update({
      where: { id: collab.id },
      data: { status: 'ACCEPTED' },
      include: { user: { select: { name: true, email: true } } }
    });
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Comments
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const documentId = req.params.id;
    const comment = await prisma.comment.create({
      data: {
        documentId,
        userId: req.user.id,
        text
      },
      include: { user: { select: { name: true } } }
    });
    
    const io = req.app.get('io');
    if (io) {
      io.to(documentId).emit('comment_added', comment);
    }
    
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resolveComment = async (req, res) => {
  try {
    const comment = await prisma.comment.update({
      where: { id: req.params.commentId },
      data: { resolved: true },
      include: { user: { select: { name: true } } }
    });
    
    const io = req.app.get('io');
    if (io) {
      io.to(comment.documentId).emit('comment_resolved', comment);
    }
    
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    await prisma.comment.delete({ where: { id: commentId } });
    
    const io = req.app.get('io');
    if (io) {
      io.to(comment.documentId).emit('comment_deleted', commentId);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
