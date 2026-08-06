import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index', {
        title: 'Inicio',
        nombreClub: 'PTC - Pichilemu Tennis Club'
    });
});

export default router;