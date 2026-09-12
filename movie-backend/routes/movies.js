const express = require('express');
const router = express.Router();

// Mock data
let movies = [
  { id: 1, title: 'Inception', rating: 5 },
  { id: 2, title: 'Interstellar', rating: 4.5 }
];

// Get all movies
router.get('/', (req, res) => {
  res.json(movies);
});

// Get a single movie
router.get('/:id', (req, res) => {
  const movie = movies.find(m => m.id === parseInt(req.params.id));
  if (!movie) return res.status(404).send('Movie not found');
  res.json(movie);
});

// Add a new movie
router.post('/', (req, res) => {
  const movie = {
    id: movies.length + 1,
    title: req.body.title,
    rating: req.body.rating
  };
  movies.push(movie);
  res.status(201).json(movie);
});

// Update a movie rating
router.patch('/:id', (req, res) => {
  const movie = movies.find(m => m.id === parseInt(req.params.id));
  if (!movie) return res.status(404).send('Movie not found');
  
  if (req.body.rating) movie.rating = req.body.rating;
  res.json(movie);
});

// Delete a movie
router.delete('/:id', (req, res) => {
  const movieIndex = movies.findIndex(m => m.id === parseInt(req.params.id));
  if (movieIndex === -1) return res.status(404).send('Movie not found');

  const deletedMovie = movies.splice(movieIndex, 1);
  res.json(deletedMovie);
});

module.exports = router;

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
