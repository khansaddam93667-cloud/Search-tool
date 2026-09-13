const express = require('express');
const router = express.Router();

// Mock data
let movies = [
  { id: 1, title: 'Inception', rating: 5 },
  { id: 2, title: 'Interstellar', rating: 4.8 },
  { id: 3, title: 'The Dark Knight', rating: 4.9 }
];

// Get all movies
router.get('/', (req, res) => {
  res.json(movies);
});

// Get a single movie
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID format' });

  const movie = movies.find(m => m.id === id);
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  res.json(movie);
});

// Add a new movie
router.post('/', (req, res) => {
  const { title, rating } = req.body;
  
  // Bug fix: Check for undefined/null instead of falsy to allow 0 rating
  if (title === undefined || rating === undefined) {
    return res.status(400).json({ message: 'Please provide title and rating' });
  }

  // Bug fix: Validate rating range and type
  if (typeof rating !== 'number' || rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be a number between 0 and 5' });
  }

  // Bug fix: Safe ID generation
  const maxId = movies.length > 0 ? Math.max(...movies.map(m => m.id)) : 0;
  const newMovie = {
    id: maxId + 1,
    title,
    rating
  };
  
  movies.push(newMovie);
  res.status(201).json(newMovie);
});

// Update a movie rating
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { rating } = req.body;

  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID format' });

  if (rating === undefined || typeof rating !== 'number' || rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'Please provide a valid rating between 0 and 5' });
  }

  const movie = movies.find(m => m.id === id);
  if (!movie) {
    return res.status(404).json({ message: 'Movie not found' });
  }

  movie.rating = rating;
  res.json(movie);
});

// Delete a movie
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID format' });

  const movieIndex = movies.findIndex(m => m.id === id);
  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' });
  }

  movies.splice(movieIndex, 1);
  res.json({ message: 'Movie deleted' });
});

module.exports = router;
const router = express.Router();

// Mock data
let movies = [
  { id: 1, title: 'Inception', rating: 5 },
  { id: 2, title: 'Interstellar', rating: 4.8 },
  { id: 3, title: 'The Dark Knight', rating: 4.9 }
];

// Get all movies
router.get('/', (req, res) => {
  res.json(movies);
});

// Get a single movie
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });
  
  const movie = movies.find(m => m.id === id);
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  res.json(movie);
});

// Add a new movie
router.post('/', (req, res) => {
  const { title, rating } = req.body;
  
  if (!title || rating === undefined) {
    return res.status(400).json({ message: 'Please provide title and rating' });
  }

  if (typeof rating !== 'number' || rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be a number between 0 and 5' });
  }

  const nextId = movies.length > 0 ? Math.max(...movies.map(m => m.id)) + 1 : 1;
  const newMovie = { id: nextId, title, rating };
  
  movies.push(newMovie);
  res.status(201).json(newMovie);
});

// Update a movie rating
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  const { rating } = req.body;
  if (rating === undefined || typeof rating !== 'number' || rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'Please provide a valid rating between 0 and 5' });
  }

  const movie = movies.find(m => m.id === id);
  if (!movie) {
    return res.status(404).json({ message: 'Movie not found' });
  }

  movie.rating = rating;
  res.json(movie);
});

// Delete a movie
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  const movieIndex = movies.findIndex(m => m.id === id);
  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' });
  }

  movies.splice(movieIndex, 1);
  res.json({ message: 'Movie deleted' });
});

module.exports = router;
});

module.exports = router;
