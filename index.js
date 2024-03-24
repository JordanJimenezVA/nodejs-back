import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { createPool } from 'mysql2/promise';
import {PORT} from './config.js';

const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;
// const LISTEN_SERVER = process.env.LISTEN_SERVER;



const app = express();

export const db = createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE
})


app.use(express.json());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(cors({
    origin: ["http://localhost:5173", "https://test-cyan-one-97.vercel.app"],
    methods: ["POST", "GET"],
    credentials: true,
}));

app.listen(PORT, () => {
    console.log("Server connected "+PORT);
});

//GESTION DE PERSONAL EXTERNO

app.get("/Personal%20Externo", async (req, res) => {
    try {
        const [rows, fields] = await db.query("SELECT * FROM personalexterno");
        res.json(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});

app.get('/FormularioPersonalExterno/suggestions', async (req, res) => {
    try {
        const { query } = req.query;
        const q = "SELECT * FROM personalexterno WHERE RUTPE LIKE ?";
        const results = await db.query(q, [`%${query}%`]);
        const suggestions = results.map((result) => result.RUTPE);
        res.json({ results });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener sugerencias' });
    }
});


app.get('/FormularioPersonalExterno/suggestion/:RUTPE', async (req, res) => {
    try {
        const { RUTPE } = req.params;
        const q = "SELECT * FROM personalexterno WHERE RUTPE = ?";
        const result = await db.query(q, [RUTPE]);
        if (result.length === 0) {
            return res.status(404).json({ error: 'Rut no encontrado' });
        }
        const { NOMBREPE, APELLIDOPE, VEHICULOPE, COLORPE, PATENTEPE, ROLPE, EMPRESAPE } = result[0][0];
        res.json({ NOMBREPE, APELLIDOPE, VEHICULOPE, COLORPE, PATENTEPE, ROLPE, EMPRESAPE });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener detalles del Rut' });
    }
});


app.post("/FormularioPersonalExterno", async (req, res) => {
    const rutPE = req.body.rutPE;
    const nombrePE = req.body.NombrePE;
    const apellidoPE = req.body.ApellidoPE;
    const vehiculoPE = req.body.VehiculoPE;
    const colorPE = req.body.ColorPE;
    const patentePE = req.body.PatentePE;
    const empresaPE = req.body.EmpresaPE;
    const rolPE = req.body.RolPE;
    const estado = "INGRESO"
    const estadoPE = "VIGENTE";
    const guiadespachoPE = "-";
    const observacionesPE = "-";
    const fechaActualUTC = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const fechaActualChile = new Date(fechaActualUTC + 'Z');
    fechaActualChile.setHours(fechaActualChile.getHours() - 3);
    const fechaActualChileFormatted = fechaActualChile.toISOString().slice(0, 19).replace('T', ' ');

    try {
        // Verificar si el RUT existe en la tabla personalexterno
        const rutExistente = await db.query('SELECT RUTPE FROM personalexterno WHERE RUTPE = ?', [rutPE]);
        if (rutExistente.length > 0) {
            // El RUT ya existe, continuar con la inserción en las otras tablas
            // insert en la tabla registros
            await db.query('INSERT INTO registros (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePE, apellidoPE, rutPE, patentePE, rolPE, observacionesPE, guiadespachoPE, fechaActualChileFormatted, estado]);

            // insert into logs
            await db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePE, apellidoPE, rutPE, patentePE, rolPE, observacionesPE, '-', fechaActualChileFormatted, estado]);

            res.send('Entrada/salida registrada correctamente');
            return;
        }

        // El RUT no existe, insertarlo en la tabla personalexterno
        await db.query('INSERT INTO personalexterno (RUTPE, nombrePE, apellidoPE, vehiculoPE, colorPE, patentePE, empresaPE, rolPE, estadoPE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [rutPE, nombrePE, apellidoPE, vehiculoPE, colorPE, patentePE, empresaPE, rolPE, estadoPE]);

        // insert en la tabla registros
        await db.query('INSERT INTO registros (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePE, apellidoPE, rutPE, patentePE, rolPE, observacionesPE, guiadespachoPE, fechaActualChileFormatted, estado]);

        // insert into logs
        await db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePE, apellidoPE, rutPE, patentePE, rolPE, observacionesPE, '-', fechaActualChileFormatted, estado]);

        res.send('Entrada/salida registrada correctamente');
    } catch (error) {
        console.error('Error al registrar ingreso:', error);
        res.status(500).send('Error al registrar ingreso');
    }
});


//GESTION PERSONAL INTERNO

app.get("/Personal%20Interno", async (req, res) => {
    try {
        const [rows, fields] = await db.query("SELECT * FROM personalinterno");
        res.json(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});

app.get('/FormularioPersonalInterno/suggestions', async (req, res) => {
    try {
        const { query } = req.query;
        const q = "SELECT * FROM personalinterno WHERE RUTPI LIKE ?";
        const results = await db.query(q, [`%${query}%`]);
        res.json({ results });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener sugerencias' });
    }
});

app.get('/FormularioPersonalInterno/suggestion/:RUTPI', async (req, res) => {
    try {
        const { RUTPI } = req.params;
        const q = "SELECT * FROM personalinterno WHERE RUTPI = ?";
        const result = await db.query(q, [RUTPI]);
        if (result.length === 0) {
            return res.status(404).json({ error: 'Rut no encontrado' });
        }
        const { NOMBREPI, APELLIDOPI, VEHICULOPI, COLORPI, PATENTEPI, ROLPI } = result[0][0];
        res.json({ NOMBREPI, APELLIDOPI, VEHICULOPI, COLORPI, PATENTEPI, ROLPI });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener detalles del Rut' });
    }
});


app.post("/FormularioPersonalInterno", async (req, res) => {
    const rutPI = req.body.rutPI;
    const nombrePI = req.body.NombrePI;
    const apellidoPI = req.body.ApellidoPI;
    const vehiculoPI = req.body.VehiculoPI;
    const colorPI = req.body.ColorPI;
    const patentePI = req.body.PatentePI;
    const rolPI = req.body.RolPI;
    const estado = "INGRESO"
    const estadoPI = "VIGENTE";
    const guiadespachoPI = "-";
    const observacionesPI = "-";
    const fechaActualUTC = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const fechaActualChile = new Date(fechaActualUTC + 'Z');
    fechaActualChile.setHours(fechaActualChile.getHours() - 3);
    const fechaActualChileFormatted = fechaActualChile.toISOString().slice(0, 19).replace('T', ' ');

    try {
        // Verificar si el RUT existe en la tabla personalinterno
        const rutExistente = await db.query('SELECT RUTPI FROM personalinterno WHERE RUTPI = ?', [rutPI]);
        if (rutExistente.length > 0) {
            // El RUT ya existe, continuar con la inserción en las otras tablas
            // insert en la tabla registro
            await db.query('INSERT INTO registros (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePI, apellidoPI, rutPI, patentePI, rolPI, observacionesPI, guiadespachoPI, fechaActualChileFormatted, estado]);

            // insert into logs
            await db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePI, apellidoPI, rutPI, patentePI, rolPI, observacionesPI, '-', fechaActualChileFormatted, estado]);

            res.send('Entrada/salida registrada correctamente');
            return;
        }

        // El RUT no existe, insertarlo en la tabla personalinterno
        await db.query('INSERT INTO personalinterno (RUTPI, nombrePI, apellidoPI, vehiculoPI, colorPI, patentePI, rolPI, estadoPI) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [rutPI, nombrePI, apellidoPI, vehiculoPI, colorPI, patentePI, rolPI, estadoPI]);

        // insert en la tabla registros
        await db.query('INSERT INTO registros (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePI, apellidoPI, rutPI, patentePI, rolPI, observacionesPI, guiadespachoPI, fechaActualChileFormatted, estado]);

        // insert into logs
        await db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePI, apellidoPI, rutPI, patentePI, rolPI, observacionesPI, '-', fechaActualChileFormatted, estado]);

        res.send('Entrada/salida registrada correctamente');
    } catch (error) {
        console.error('Error al registrar ingreso:', error);
        res.status(500).send('Error al registrar ingreso');
    }
});


// GESTION CAMIONES

app.get("/Camiones", async (req, res) => {
    try {
        const [rows, fields] = await db.query("SELECT * FROM camiones");
        res.json(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});


app.get('/FormularioCamiones/suggestions', async (req, res) => {
    try {
        const { query } = req.query;
        const q = "SELECT * FROM camiones WHERE RUTCA LIKE ?";
        const results = await db.query(q, [`%${query}%`]);
        res.json({ results });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener sugerencias' });
    }
});

app.get('/FormularioCamiones/suggestion/:RUTCA', async (req, res) => {
    try {
        const { RUTCA } = req.params;
        const q = "SELECT * FROM camiones WHERE RUTCA = ?";
        const result = await db.query(q, [RUTCA]);
        if (result.length === 0) {
            return res.status(404).json({ error: 'Rut no encontrado' });
        }
        const { CHOFERCA, APELLIDOCHOFERCA, RUTCA: rutCA, PEONETACA, PATENTECA, MARCACA, TIPOCA, MODELOCA, COLORCA, EMPRESACA, OBSERVACIONESCA, GUIADESPACHOCA } = result[0][0];
        res.json({ CHOFERCA, APELLIDOCHOFERCA, RUTCA: rutCA, PEONETACA, PATENTECA, MARCACA, TIPOCA, MODELOCA, COLORCA, EMPRESACA, OBSERVACIONESCA, GUIADESPACHOCA });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener detalles del Rut' });
    }
});

app.post("/FormularioCamiones", async (req, res) => {
    const choferCA = req.body.ChoferCA;
    const apellidochoferCA = req.body.ApellidoChoferCA;
    const rutCA = req.body.RutCA;
    const peonetaCA = req.body.PeonetaCA;
    const patenteCA = req.body.PatenteCA;
    const marcaCA = req.body.MarcaCA;
    const tipoCA = req.body.TipoCA;
    const modeloCA = req.body.ModeloCA;
    const colorCA = req.body.ColorCA;
    const empresaCA = req.body.EmpresaCA;
    const observacionesCA = req.body.ObservacionesCA;
    const guiaDespachoCA = req.body.GuiaDespachoCA;
    const estado = "INGRESO"
    const estadoCA = "VIGENTE";
    const rolCA = "CAMION";

    const fechaActualUTC = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const fechaActualChile = new Date(fechaActualUTC + 'Z');
    fechaActualChile.setHours(fechaActualChile.getHours() - 3);
    const fechaActualChileFormatted = fechaActualChile.toISOString().slice(0, 19).replace('T', ' ');

    try {
        // Verificar si el RUT existe en la tabla personalinterno
        const rutExistente = await db.query('SELECT RUTCA FROM camiones WHERE RUTCA = ?', [rutCA]);
        if (rutExistente.length > 0) {
            // El RUT ya existe, continuar con la inserción en las otras tablas
            // insert en la tabla registro
            await db.query('INSERT INTO registros (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [choferCA, apellidochoferCA, rutCA, patenteCA, rolCA, observacionesCA, guiaDespachoCA, fechaActualChileFormatted, estado]);

            // insert into logs
            await db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [choferCA, apellidochoferCA, rutCA, patenteCA, rolCA, observacionesCA, guiaDespachoCA, fechaActualChileFormatted, estado]);

            res.send('Entrada/salida registrada correctamente');
            return;
        }

        // El RUT no existe, insertarlo en la tabla camiones
        await db.query('INSERT INTO camiones (CHOFERCA, APELLIDOCHOFERCA, RUTCA, PEONETACA, PATENTECA, MARCACA, TIPOCA, MODELOCA, COLORCA, EMPRESACA, ESTADOCA) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [choferCA, apellidochoferCA, rutCA, peonetaCA, patenteCA, marcaCA, tipoCA, modeloCA, colorCA, empresaCA, observacionesCA, guiaDespachoCA, estadoCA]);

        // insert en la tabla registros
        await db.query('INSERT INTO registros (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [choferCA, apellidochoferCA, rutCA, patenteCA, rolCA, observacionesCA, guiaDespachoCA, fechaActualChileFormatted, estado]);

        // insert into logs
        await db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [choferCA, apellidochoferCA, rutCA, patenteCA, rolCA, observacionesCA, guiaDespachoCA, fechaActualChileFormatted, estado]);

        res.send('Entrada/salida registrada correctamente');
    } catch (error) {
        console.error('Error al registrar ingreso:', error);
        res.status(500).send('Error al registrar ingreso');
    }
});


// GESTION DE INGRESOS/SALIDAS

app.get("/TablaIngreso", async (req, res) => {
    try {
        const [rows, fields] = await db.query("SELECT * FROM registros WHERE ESTADO = 'INGRESO'");
        res.json(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});


app.get("/Logs", async (req, res) => {
    try {
        const [rows, fields] = await db.query("SELECT * FROM logs");
        res.json(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});


app.get("/FormularioSalida/:IDR", async (req, res) => {
    const { IDR } = req.params;
    try {
        const [rows, fields] = await db.query("SELECT * FROM registros WHERE IDR = ?", [IDR]);
        res.json(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});


app.post("/FormularioSalida/:IDR", async (req, res) => {
    const IDR = req.params.IDR;
    const personal = req.body.PERSONAL;
    const apellido = req.body.APELLIDO;
    const rut = req.body.RUT;
    const patente = req.body.PATENTE;
    const rol = req.body.ROL;
    const observaciones = req.body.OBSERVACIONES;
    const guiadespacho = req.body.GUIADESPACHO;
    const estadoCA = "salida";
    const fechaActualUTC = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const fechaActualChile = new Date(fechaActualUTC + 'Z');
    fechaActualChile.setHours(fechaActualChile.getHours() - 3);

    const fechaActualChileFormatted = fechaActualChile.toISOString().slice(0, 19).replace('T', ' ');

    try {

        await db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHASALIDA, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [personal, apellido, rut, patente, rol, observaciones, guiadespacho, fechaActualChileFormatted, estadoCA]);

        await db.query('UPDATE registros SET ESTADO = ? WHERE IDR = ?', ['SALIDA', IDR]);


        res.send('Salida registrada correctamente');

    } catch (error) {
        console.error('Error al marcar salida:', error);
        res.status(500).send('Error al marcar salida');
    }
});



app.post("/marcarSalida", (req, res) => {
    const { IDR, ROL } = req.body;
    const fechaSalida = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Aquí debes realizar la actualización en la tabla registros
    // Por ejemplo, suponiendo que la tabla tiene un campo ESTADO que indica si la entrada está vigente
    db.query('UPDATE registros SET ESTADO = ?, FECHASALIDA = ? WHERE IDR = ?', ['salida', fechaSalida, IDR], (err, result) => {
        if (err) {
            console.error('Error al marcar salida:', err);
            res.status(500).send('Error al marcar salida');
            return;
        }

        console.log('Salida registrada correctamente:', result);
        res.send('Salida registrada correctamente');
    });
});

// GESTION LOGIN
app.post('/Login', (req, res) => {
    const sql = "SELECT * FROM usuarios WHERE rutU = ? AND passwordU = ?";
    db.query(sql, [req.body.rutU, req.body.passwordU], (err, data) => {
        if (err) return res.json({ Message: "Server Error" });
        if (data.length > 0) {
            const rut = data[0].rut;
            const token = pkg.sign({ rut }, "our-jsonwebtoken-secret-key", { expiresIn: '1d' });
            res.cookie('token', token);
            return res.json({ Status: "Success" });
        } else {
            return res.json({ Message: "No existe" });
        }
    })
})




