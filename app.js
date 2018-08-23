const express = require('express');

const PORT = process.env.PORT || 5000

const app = express();

app.use('/static', express.static('public')); // serves our static files from the directory 'public', to the .../static address in the browser 

app.set('view engine', 'pug');

const mainRoutes = require('./routes');

app.use(mainRoutes);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.locals.error = err;
  res.status(err.status);
  res.render('error');
});

app.listen(PORT, () => {  // callback function is only required to log the info message to the console
  console.log(`Listening on localhost:${PORT}`);
});
