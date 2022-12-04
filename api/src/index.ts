import express from 'express';
import { createPod } from './createPod';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/pod/create', async (req, res) => {
  await createPod();
});


app.listen(8000, () => {
  console.log('listening at port 8000');
});