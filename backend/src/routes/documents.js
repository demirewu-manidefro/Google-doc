const express = require('express');
const router = express.Router();
const docController = require('../controllers/documents');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

// Documents
router.get('/', docController.getAll);
router.post('/', docController.create);
router.get('/:id', docController.getById);
router.put('/:id', docController.rename);
router.delete('/:id', docController.deleteDoc);
router.post('/:id/duplicate', docController.duplicate);

// Comments
router.post('/:id/comments', docController.addComment);
router.put('/:id/comments/:commentId/resolve', docController.resolveComment);
router.delete('/:id/comments/:commentId', docController.deleteComment);

module.exports = router;
