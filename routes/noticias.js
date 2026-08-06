import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Módulo en construcción');
});

export default router;