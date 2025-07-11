import { RequestHandler } from 'express';
import cors from 'cors';

const corsHandler: RequestHandler = cors({
  origin: '*', // Allows requests from all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
  allowedHeaders: ['Content-Type', 'X-Requested-With', 'Accept'], // Include necessary headers
});

export default corsHandler;
