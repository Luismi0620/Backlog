const express = require('express');
const fs = require('fs');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 3000;

// Crear un servidor HTTP y asociar socket.io
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());

// Ruta para la página principal (GET /)
app.get('/', (req, res) => {
    res.send('¡Servidor funcionando correctamente!');
});

// Leer los datos del archivo JSON (para tutorías)
const readTutorias = () => {
    const data = fs.readFileSync('tutorias.json', 'utf-8');
    return JSON.parse(data);
};

// Escribir los datos en el archivo JSON (para tutorías)
const writeTutorias = (tutorias) => {
    fs.writeFileSync('tutorias.json', JSON.stringify(tutorias, null, 2));
};

// Leer los usuarios del archivo users.json
const readUsers = () => {
    const data = fs.readFileSync('users.json', 'utf-8');
    return JSON.parse(data);
};

// Escribir los usuarios en el archivo users.json
const writeUsers = (users) => {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
};

// Clases para Estudiante y Tutor
class Estudiante {
    constructor(email, password) {
        this.email = email;
        this.password = password;
        this.role = 'estudiante';
    }
}

class Tutor {
    constructor(email, password, materia, calificacion) {
        this.email = email;
        this.password = password;
        this.role = 'tutor';
        this.materia = materia;
        this.calificacion = calificacion;
    }
}

// Endpoint para registrar usuarios
app.post('/register', (req, res) => {
    const { email, password, role, materia, calificacion } = req.body;
    const users = readUsers();

    // Verificar si el usuario ya existe
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'El usuario ya existe' });
    }

    let newUser;
    if (role === 'estudiante') {
        newUser = new Estudiante(email, password); // Crear un nuevo estudiante
    } else if (role === 'tutor') {
        newUser = new Tutor(email, password, materia, calificacion); // Crear un nuevo tutor
    }

    users.push(newUser);  // Agregar el nuevo usuario al array
    writeUsers(users);  // Guardar los usuarios en el archivo users.json

    res.json({ message: 'Usuario registrado exitosamente' });
});

// Endpoint para iniciar sesión
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = readUsers();  // Leer los usuarios desde users.json

    // Buscar al usuario en el archivo JSON
    const user = users.find(user => user.email === email);
    if (!user) {
        return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // Verificar la contraseña
    if (user.password !== password) {
        return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    res.json({ message: 'Inicio de sesión exitoso', role: user.role });
});

// Endpoint para manejar la solicitud de tutorías
app.post('/solicitar-tutoria', (req, res) => {
    const { materia, tema } = req.body;
    const tutorias = readTutorias();  // Leer las tutorías existentes desde tutorias.json

    // Crear una nueva tutoría
    const nuevaTutoria = { materia, tema };
    tutorias.push(nuevaTutoria);  // Agregar la nueva tutoría al array
    writeTutorias(tutorias);  // Guardar las tutorías en el archivo tutorias.json

    // Emitir el evento de nueva tutoría a todos los clientes conectados
    io.emit('nueva-tutoria', nuevaTutoria);

    res.json({ success: true, message: 'Tutoría solicitada exitosamente' });
});

// Endpoint para finalizar tutoría
app.post('/finalizar-tutoria', (req, res) => {
    // Aquí puedes agregar cualquier lógica adicional para finalizar la tutoría si es necesario
    res.json({ success: true, message: 'Tutoría finalizada exitosamente' });
});

// Configurar socket.io para manejar las conexiones de los clientes
io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado');
    
    // Enviar las tutorías actuales al cliente cuando se conecta
    const tutorias = readTutorias();
    socket.emit('cargar-tutorias', tutorias);
});

// Iniciar el servidor con socket.io
server.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
