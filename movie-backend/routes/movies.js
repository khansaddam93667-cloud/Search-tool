const express = require('express');
const router = express.Router();

// Mock data
let movies = [
  { id: 1, title: 'Inception', rating: 5 },
  { id: 2, title: 'Interstellar', rating: 4.8 }
];

// Get all movies
router.get('/', (req, res) => {
  res.json(movies);
});

// Add a new movie
router.post('/', (req, res) => {
  const { title, rating } = req.body;
  if (!title || !rating) {
    return res.status(400).json({ message: 'Please provide title and rating' });
  }
  const newMovie = {
    id: movies.length + 1,
    title,
    rating
  };
  movies.push(newMovie);
  res.status(201).json(newMovie);
});

// Update a movie rating
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  const movie = movies.find(m => m.id === parseInt(id));
  if (!movie) {
    return res.status(404).json({ message: 'Movie not found' });
  }
  movie.rating = rating;
  res.json(movie);
});

// Delete a movie
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  movies = movies.filter(m => m.id !== parseInt(id));
  res.json({ message: 'Movie deleted' });
});

module.exports = router;
