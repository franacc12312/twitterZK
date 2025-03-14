/**
 * Servidor proxy para resolver problemas de CORS con la API de Twitter
 * Este servidor recibe solicitudes del frontend y las reenvía a Twitter
 */

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PROXY_PORT || 3000;

// Verificar que las credenciales necesarias estén disponibles
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
  console.error('Error: TWITTER_CLIENT_ID y TWITTER_CLIENT_SECRET deben estar configurados en el archivo .env');
  process.exit(1);
}

// Configuración de middlewares
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:1234', // Permitir solo solicitudes desde nuestro frontend
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para logging de solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/**
 * Endpoint para intercambiar el código de autorización por un token de acceso
 * Recibe el código y el code_verifier del frontend y maneja la solicitud a Twitter
 */
app.post('/api/twitter/token', async (req, res) => {
  console.log('Recibida solicitud de token');
  
  const { code, codeVerifier, redirectUri } = req.body;
  
  if (!code || !codeVerifier) {
    console.error('Error: Faltan parámetros requeridos (code o codeVerifier)');
    return res.status(400).json({ 
      error: 'Faltan parámetros requeridos (code o codeVerifier)' 
    });
  }

  try {
    // Crear el encabezado de autorización básica (Basic Authentication)
    // Formato: Basic base64(client_id:client_secret)
    const authHeader = 'Basic ' + Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');
    console.log('Encabezado de autorización generado');

    // Preparar los parámetros para la solicitud a Twitter
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri || 'http://localhost:1234/callback');
    params.append('client_id', TWITTER_CLIENT_ID);
    params.append('code_verifier', codeVerifier);

    console.log('Enviando solicitud a Twitter API para obtener token');
    console.log('URL de redirección:', redirectUri || 'http://localhost:1234/callback');
    
    // Hacer la solicitud a Twitter con el encabezado de autorización
    const response = await axios.post('https://api.twitter.com/2/oauth2/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader
      }
    });

    console.log('Token obtenido exitosamente');
    
    // Devolver los datos del token al frontend
    res.json(response.data);
  } catch (error) {
    console.error('Error al obtener token de Twitter:', error.message);
    
    // Capturar detalles específicos del error si están disponibles
    let errorMessage = 'Error al obtener token de acceso';
    let statusCode = 500;
    
    if (error.response) {
      // Error con respuesta del servidor
      console.error('Detalles del error:', error.response.data);
      errorMessage = `Twitter API respondió con error: ${error.response.status} ${JSON.stringify(error.response.data)}`;
      statusCode = error.response.status;
    } else if (error.request) {
      // Error sin respuesta (problema de red)
      errorMessage = 'No se pudo conectar con Twitter API';
    }
    
    res.status(statusCode).json({ error: errorMessage });
  }
});

/**
 * Nuevo endpoint para obtener datos del usuario desde la API de Twitter
 * Recibe el token de acceso del frontend y lo usa para hacer una solicitud a Twitter
 */
app.post('/api/twitter/user', async (req, res) => {
  console.log('Recibida solicitud para obtener datos de usuario');
  
  const { accessToken } = req.body;
  
  if (!accessToken) {
    console.error('Error: Falta el token de acceso');
    return res.status(400).json({ 
      error: 'Falta el token de acceso requerido' 
    });
  }

  try {
    console.log('Enviando solicitud a Twitter API para obtener datos de usuario');
    
    // Hacer la solicitud a Twitter con el token de acceso
    const response = await axios.get(
      'https://api.twitter.com/2/users/me?user.fields=created_at,public_metrics', 
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Datos de usuario obtenidos exitosamente');
    
    // Devolver los datos del usuario al frontend
    res.json(response.data);
  } catch (error) {
    console.error('Error al obtener datos de usuario de Twitter:', error.message);
    
    // Capturar detalles específicos del error si están disponibles
    let errorMessage = 'Error al obtener datos de usuario';
    let statusCode = 500;
    
    if (error.response) {
      // Error con respuesta del servidor
      console.error('Detalles del error:', error.response.data);
      errorMessage = `Twitter API respondió con error: ${error.response.status} ${JSON.stringify(error.response.data)}`;
      statusCode = error.response.status;
    } else if (error.request) {
      // Error sin respuesta (problema de red)
      errorMessage = 'No se pudo conectar con Twitter API';
    }
    
    res.status(statusCode).json({ error: errorMessage });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor proxy ejecutándose en http://localhost:${PORT}`);
  console.log(`Usando CLIENT_ID: ${TWITTER_CLIENT_ID.substring(0, 5)}...`);
  console.log(`CLIENT_SECRET está ${TWITTER_CLIENT_SECRET ? 'configurado' : 'NO configurado'}`);
}); 