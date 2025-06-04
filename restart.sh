#!/bin/bash
pm2 delete CrimznBot || true
source .env
pm2 start server.js --name CrimznBot
