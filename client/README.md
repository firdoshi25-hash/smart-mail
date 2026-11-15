# Smart Mail client

The React/Vite client is configured in this folder. For the complete setup, environment variables, and instructions to run both client and API, see the [project README](../README.md).

## Client commands

```sh
npm install
npm run dev
npm run lint
npm run build
```

By default, the client uses `http://localhost:9000/api` for REST requests and `http://localhost:9000` for Socket.IO. Configure `VITE_API_URL` and `VITE_SOCKET_URL` in a client `.env` file to change these endpoints.
