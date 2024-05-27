import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { createPool } from 'mysql2/promise';
import { PORT } from './config.js';
import multer from 'multer';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;
//const LISTEN_SERVER = process.env.LISTEN_SERVER;




const app = express();

export const db = createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE
})


app.use(express.json());

// Configurar body-parser para aceptar cargas de hasta 50MB
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


app.use(cookieParser());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'imagenes/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.jpg')
    }
})

const upload = multer({ storage: storage });


const __filename = fileURLToPath(import.meta.url);
// Obtén el directorio del archivo actual
const __dirname = path.dirname(__filename);
app.use('/imagenes', express.static(path.join(__dirname, 'imagenes')));

app.use(cors({
    origin: ["http://localhost:5173", "https://sistemasandes.vercel.app"],
    methods: ["POST", "GET", "DELETE", "PUT"],
    credentials: true,
}));

app.listen(PORT, () => {
    console.log("Server connected " + PORT);
});



//GESTION INFORMES CAMION

app.get("/InformeCamion", async (req, res) => {
    try {
        const [rows, fields] = await db.query("SELECT * FROM revision");
        res.json(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});

app.get("/VerInforme/:IDR", async (req, res) => {
    const { IDR } = req.params;
    try {
        const [rows, fields] = await db.query("SELECT * FROM revision WHERE IDR = ?", [IDR]);
        res.json(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});

//GESTION REVISION
app.get("/Revision", async (req, res) => {
    try {
        const [rows, fields] = await db.query("SELECT * FROM registros WHERE rol = 'CAMION' AND chequeo = 'NO'");
        res.json(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});


app.get("/ProgresoRevision/:IDR", async (req, res) => {
    const { IDR } = req.params;
    try {
        const [rows, fields] = await db.query("SELECT * FROM progresorevision WHERE IDR = ?", [IDR]);
        res.json(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});


app.post("/GuardarProgreso/:IDR", upload.array('FOTOS'), async (req, res) => {
    const { IDR } = req.params;
    const personal = req.body.PERSONAL;
    const apellido = req.body.APELLIDO;
    const rut = req.body.RUT;
    const patente = req.body.PATENTE;
    const rol = req.body.ROL;
    const observaciones = req.body.OBSERVACIONES;
    const guiadespacho = req.body.GUIADESPACHO;
    const selloCA = req.body.SELLO;
    const anden = req.body.ANDEN;
    const kilos = req.body.KILOS;
    const pallets = req.body.PALLETS;
    const supervisor = req.body.SUPERVISOR;
    const jefet = req.body.JEFET;
    const fotos = req.files ? req.files.map(file => file.filename) : [];

    try {
        // Verificar si ya existe un registro en progresorevision para el IDR dado
        const [existingRows] = await db.query("SELECT IDR FROM progresorevision WHERE IDR = ?", [IDR]);

        if (existingRows.length > 0) {
            // Construir consulta de actualización dinámica
            const fields = [personal, apellido, rut, patente, rol, observaciones, guiadespacho, selloCA, anden, kilos, pallets, supervisor, jefet];
            let updateQuery = "UPDATE progresorevision SET PERSONAL = ?, APELLIDO = ?, RUT = ?, PATENTE = ?, ROL = ?, OBSERVACIONES = ?, GUIADESPACHO = ?, SELLO = ?, ANDEN = ?, KILOS = ?, PALLETS = ?, SUPERVISOR = ?, JEFET = ?";
            
            if (fotos.length > 0) {
                updateQuery += ", FOTOS = ?";
                fields.push(fotos.join(', '));
            }

            updateQuery += " WHERE IDR = ?";
            fields.push(IDR);

            await db.query(updateQuery, fields);
            res.json({ message: 'Progreso actualizado correctamente' });
        } else {
            // Insertar un nuevo registro
            await db.query('INSERT INTO progresorevision (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, SELLO, ANDEN, KILOS, PALLETS, SUPERVISOR, JEFET, FOTOS, FECHAINICIO, IDR) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [personal, apellido, rut, patente, rol, observaciones, guiadespacho, selloCA, anden, kilos, pallets, supervisor, jefet, fotos.join(', '), fechaInicio, IDR]);
            res.json({ message: 'Progreso guardado correctamente' });
        }
    } catch (error) {
        console.error('Error al guardar el progreso:', error);
        res.status(500).json({ error: 'Error al guardar el progreso' });
    }
});

//GESTION MANTENEDOR PERSONAL INTERNO

app.put("/EditarPersonalInterno/:IDPI", async (req, res) => {
    const IDPI = req.params.IDPI;
    const { RUTPI, NOMBREPI, APELLIDOPI, ROLPI, ESTADOPI, VEHICULOPI, PATENTEPI, COLORPI } = req.body;

    try {
        // Verificar si el IDPI existe en la tabla personalinterno
        const existenciaPI = await db.query('SELECT COUNT(*) AS count FROM personalinterno WHERE IDPI = ?', [IDPI]);
        const count = existenciaPI[0][0].count;
        if (count === 0) {
            // El IDPI no existe en la tabla personalinterno
            res.status(404).send('El IDPI no existe en la base de datos');
            return;
        }

        // El IDPI existe, actualizar los datos en la tabla personalinterno
        await db.query('UPDATE personalinterno SET RUTPI = ?, NOMBREPI = ?, APELLIDOPI = ?, ROLPI = ?, ESTADOPI = ?, VEHICULOPI = ?, PATENTEPI = ?, COLORPI = ? WHERE IDPI = ?', [RUTPI, NOMBREPI, APELLIDOPI, ROLPI, ESTADOPI, VEHICULOPI, PATENTEPI, COLORPI, IDPI]);

        res.send('Actualización realizada con éxito');
    } catch (error) {
        console.error('Error al realizar la actualización:', error);
        res.status(500).send('Error al realizar la actualización');
    }
});

app.get("/EditarPersonalInterno/:IDPI", async (req, res) => {
    const { IDPI } = req.params;
    try {
        const [rows, fields] = await db.query("SELECT * FROM personalinterno WHERE IDPI = ?", [IDPI]);
        res.json(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});


app.delete("/Personal%20Interno/:IDPI", async (req, res) => {
    const { IDPI } = req.params;
    try {
        await db.query(`DELETE FROM personalinterno WHERE IDPI = ?`, [IDPI]);

        res.send("Usuario eliminado correctamente");
    } catch (error) {
        console.error("Error al eliminar registro:", error);
        res.status(500).send("Error al eliminar registro");
    }
});

app.post("/AgregarPersonalInterno", async (req, res) => {
    const rutPI = req.body.rutPI;
    const nombrePI = req.body.NombrePI;
    const apellidoPI = req.body.ApellidoPI;
    const vehiculoPI = req.body.VehiculoPI;
    const colorPI = req.body.ColorPI;
    const patentePI = req.body.PatentePI;
    const rolPI = req.body.RolPI;
    const estadoPI = "VIGENTE";


    try {
        // Verificar si el RUT existe en la tabla personalinterno
        const rutExistente = await db.query('SELECT COUNT(*) AS count FROM personalinterno WHERE RUTPI = ?', [rutPI]);
        const count = rutExistente[0][0].count;
        if (count > 0) {
            // El RUT ya existe en la tabla personalinterno
            res.send('El RUT ya existe en la base de datos');
            return;
        }

        // El RUT no existe, insertarlo en la tabla personalinterno
        await db.query('INSERT INTO personalinterno (RUTPI, nombrePI, apellidoPI, vehiculoPI, colorPI, patentePI, rolPI, estadoPI) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [rutPI, nombrePI, apellidoPI, vehiculoPI, colorPI, patentePI, rolPI, estadoPI]);

        res.send('Ingreso realizado con exito');
    } catch (error) {
        console.error('Error al registrar ingreso:', error);
        res.status(500).send('Error al registrar ingreso');
    }
});








//GESTION MANTENEDOR PERSONAL EXTERNO

app.put("/EditarPersonalExterno/:IDPE", async (req, res) => {
    const IDPE = req.params.IDPE;
    const { RUTPE, NOMBREPE, APELLIDOPE, ROLPE, EMPRESAPE, ESTADOPE, VEHICULOPE, PATENTEPE, COLORPE } = req.body;

    try {
        // Verificar si el IDPE existe en la tabla personalinterno
        const existenciaPI = await db.query('SELECT COUNT(*) AS count FROM personalexterno WHERE IDPE = ?', [IDPE]);
        const count = existenciaPI[0][0].count;
        if (count === 0) {
            // El IDPI no existe en la tabla personalinterno
            res.status(404).send('El IDPE no existe en la base de datos');
            return;
        }

        // El IDPI existe, actualizar los datos en la tabla personalinterno
        await db.query('UPDATE personalexterno SET RUTPE = ?, NOMBREPE = ?, APELLIDOPE = ?, ROLPE = ?, EMPRESAPE = ?, ESTADOPE = ?, VEHICULOPE = ?, PATENTEPE = ?, COLORPE = ? WHERE IDPE = ?', [RUTPE, NOMBREPE, APELLIDOPE, ROLPE, EMPRESAPE, ESTADOPE, VEHICULOPE, PATENTEPE, COLORPE, IDPE]);

        res.send('Actualización realizada con éxito');
    } catch (error) {
        console.error('Error al realizar la actualización:', error);
        res.status(500).send('Error al realizar la actualización');
    }
});

app.get("/EditarPersonalExterno/:IDPE", async (req, res) => {
    const { IDPE } = req.params;
    try {
        const [rows, fields] = await db.query("SELECT * FROM personalexterno WHERE IDPE = ?", [IDPE]);
        res.json(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});

app.delete("/Personal%20Externo/:IDPE", async (req, res) => {
    const { IDPE } = req.params;
    try {
        await db.query(`DELETE FROM personalexterno WHERE IDPE = ?`, [IDPE]);

        res.send("Usuario eliminado correctamente");
    } catch (error) {
        console.error("Error al eliminar registro:", error);
        res.status(500).send("Error al eliminar registro");
    }
});

app.post("/AgregarPersonalExterno", async (req, res) => {
    const rutPE = req.body.rutPE;
    const nombrePE = req.body.NombrePE;
    const apellidoPE = req.body.ApellidoPE;
    const vehiculoPE = req.body.VehiculoPE;
    const colorPE = req.body.ColorPE;
    const patentePE = req.body.PatentePE;
    const rolPE = req.body.RolPE;
    const empresaPE = req.body.EmpresaPE;
    const estadoPE = "VIGENTE";


    try {
        // Verificar si el RUT existe en la tabla personalinterno
        const rutExistente = await db.query('SELECT COUNT(*) AS count FROM personalexterno WHERE RUTPE = ?', [rutPE]);
        const count = rutExistente[0][0].count;
        if (count > 0) {
            // El RUT ya existe en la tabla personalinterno
            res.send('El RUT ya existe en la base de datos');
            return;
        }

        // El RUT no existe, insertarlo en la tabla personalexterno
        await db.query('INSERT INTO personalexterno (RUTPE, nombrePE, apellidoPE, vehiculoPE, colorPE, patentePE, rolPE, empresaPE, estadoPE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [rutPE, nombrePE, apellidoPE, vehiculoPE, colorPE, patentePE, rolPE, empresaPE, estadoPE]);

        res.send('Ingreso realizado con exito');
    } catch (error) {
        console.error('Error al registrar ingreso:', error);
        res.status(500).send('Error al registrar ingreso');
    }
});




//GESTION MANTENEDOR CAMION

app.put("/EditarCamiones/:IDCA", async (req, res) => {
    const IDCA = req.params.IDCA;
    const { RUTCA, CHOFERCA, APELLIDOCHOFERCA, PATENTECA, MARCACA, TIPOCA, MODELOCA, COLORCA, EMPRESACA, ESTADOCA } = req.body;

    try {
        // Verificar si el IDPE existe en la tabla camiones
        const existenciaPI = await db.query('SELECT COUNT(*) AS count FROM camiones WHERE IDCA = ?', [IDCA]);
        const count = existenciaPI[0][0].count;
        if (count === 0) {
            // El IDPI no existe en la tabla camiones
            res.status(404).send('El IDCA no existe en la base de datos');
            return;
        }

        // El IDPI existe, actualizar los datos en la tabla camiones
        await db.query('UPDATE camiones SET CHOFERCA = ?, APELLIDOCHOFERCA = ?, RUTCA = ?, PATENTECA = ?, MARCACA = ?, TIPOCA = ?, MODELOCA = ?, COLORCA = ?, EMPRESACA = ?, ESTADOCA = ? WHERE IDCA = ?', [CHOFERCA, APELLIDOCHOFERCA, RUTCA, PATENTECA, MARCACA, TIPOCA, MODELOCA, COLORCA, EMPRESACA, ESTADOCA, IDCA]);


        res.send('Actualización realizada con éxito');
    } catch (error) {
        console.error('Error al realizar la actualización:', error);
        res.status(500).send('Error al realizar la actualización');
    }
});

app.get("/EditarCamiones/:IDCA", async (req, res) => {
    const { IDCA } = req.params;
    try {
        const [rows, fields] = await db.query("SELECT * FROM camiones WHERE IDCA = ?", [IDCA]);
        res.json(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});

app.delete("/camiones/:IDCA", async (req, res) => {
    const { IDCA } = req.params;
    try {
        await db.query(`DELETE FROM camiones WHERE IDCA = ?`, [IDCA]);

        res.send("Usuario eliminado correctamente");
    } catch (error) {
        console.error("Error al eliminar registro:", error);
        res.status(500).send("Error al eliminar registro");
    }
});

app.post("/AgregarCamion", async (req, res) => {
    const rutCA = req.body.RutCA;
    const choferCA = req.body.ChoferCA;
    const apellidoCA = req.body.ApellidoCA;
    const tipoCA = req.body.TipoCA;
    const modeloCA = req.body.ModeloCA;
    const colorCA = req.body.ColorCA;
    const patenteCA = req.body.PatenteCA;
    const marcaCA = req.body.MarcaCA;
    const empresaCA = req.body.EmpresaCA;
    const estadoCA = "VIGENTE";


    try {
        // Verificar si el RUT existe en la tabla camiones
        const rutExistente = await db.query('SELECT COUNT(*) AS count FROM camiones WHERE RUTCA = ?', [rutCA]);
        const count = rutExistente[0][0].count;
        if (count > 0) {
            // El RUT ya existe en la tabla camiones
            res.send('El RUT ya existe en la base de datos');
            return;
        }

        // El RUT no existe, insertarlo en la tabla personalexterno
        await db.query('INSERT INTO camiones (rutCA, choferCA, apellidoCA, tipoCA, modeloCA, colorCA, patenteCA, marcaCA, empresaCA, estadoCA) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [rutCA, choferCA, apellidoCA, tipoCA, modeloCA, colorCA, patenteCA, marcaCA, empresaCA, estadoCA]);

        res.send('Ingreso realizado con exito');
    } catch (error) {
        console.error('Error al registrar ingreso:', error);
        res.status(500).send('Error al registrar ingreso');
    }
});




// GESTION LOGIN

app.get('/UserType/', async (req, res) => {
    const { RUTU } = req.query;

    if (!RUTU) {
        return res.status(400).json({ message: 'El parámetro rut es requerido' });
    }

    const sql = "SELECT TIPOU, NOMBREU FROM usuarios WHERE RUTU = ?";
    try {
        const [rows] = await db.query(sql, [RUTU.toString()]);
        if (rows.length > 0) {
            const userType = rows[0].TIPOU;
            const nombreUsuario = rows[0].NOMBREU;
            return res.json({ userType, nombreUsuario });
        } else {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (err) {
        console.log("Error executing query:", err);
        return res.status(500).json({ Message: "Server Error" });
    }
});




app.get('/Logout', (req, res) => {
    res.clearCookie('token');
    return res.json({ Status: "Sucess" })
})

app.post('/Login', async (req, res) => {

    const sql = "SELECT * FROM usuarios WHERE RUTU = ? AND PASSWORDU = ?";
    try {
        const [rows] = await db.query(sql, [req.body.rutU, req.body.passwordU]);
        if (rows.length > 0) {
            // Usuario autenticado correctamente
            const rut = rows[0].RUTU;
            const token = jwt.sign({ rut }, "our-jsonwebtoken-secret-key", { expiresIn: '1d' });
            res.cookie('token', token);
            return res.json({ Status: "Success" });
        } else {
            // Credenciales incorrectas
            return res.json({ Message: "Credenciales incorrectas" });
        }
    } catch (err) {
        console.log("Error executing query:", err);
        return res.status(500).json({ Message: "Server Error" });
    }
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
        const q = "SELECT * FROM personalexterno WHERE RUTPE LIKE ? AND ESTADOPE = 'VIGENTE'";
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
    const observacionesPE = req.body.ObservacionesPE;
    const estado = "INGRESO"
    const estadoPE = "VIGENTE";
    const guiadespachoPE = "-";
    const selloCA = "-";
    const chequeo = "NO";
    const fechaActualChileFormatted = req.body.fechaActualChile;

    try {
        // Verificar si el RUT existe en la tabla personalexterno
        const rutExistente = await db.query('SELECT COUNT(*) AS count FROM personalexterno WHERE RUTPE = ?', [rutPE]);
        const count = rutExistente[0][0].count;
        if (count > 0) {
            // El RUT ya existe, continuar con la inserción en las otras tablas
            // insert en la tabla registros
            await db.query('INSERT INTO registros (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, SELLO, ESTADO, CHEQUEO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePE, apellidoPE, rutPE, patentePE, rolPE, observacionesPE, guiadespachoPE, fechaActualChileFormatted, selloCA, estado, chequeo]);

            // insert into logs
            await db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePE, apellidoPE, rutPE, patentePE, rolPE, observacionesPE, guiadespachoPE, fechaActualChileFormatted, estado]);

            res.send('Entrada/salida registrada correctamente');
            return;
        }

        // El RUT no existe, insertarlo en la tabla personalexterno
        await db.query('INSERT INTO personalexterno (RUTPE, NOMBREPE, APELLIDOPE, VEHICULOPE, COLORPE, PATENTEPE, EMPRESAPE, ROLPE, ESTADOPE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [rutPE, nombrePE, apellidoPE, vehiculoPE, colorPE, patentePE, empresaPE, rolPE, estadoPE]);

        // insert en la tabla registros
        await db.query('INSERT INTO registros (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, SELLO ,ESTADO, CHEQUEO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePE, apellidoPE, rutPE, patentePE, rolPE, observacionesPE, guiadespachoPE, fechaActualChileFormatted, selloCA, estado, chequeo]);
        // insert into logs
        await db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePE, apellidoPE, rutPE, patentePE, rolPE, observacionesPE, guiadespachoPE, fechaActualChileFormatted, estado]);

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
        const q = "SELECT * FROM personalexterno WHERE RUTPE LIKE ? AND ESTADOPI = 'VIGENTE'";
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
    const observacionesPI = req.body.ObservacionesPI;
    const estado = "INGRESO"
    const estadoPI = "VIGENTE";
    const guiadespachoPI = "-";
    const selloCA = "-";
    const chequeo = "NO";
    const fechaActualChileFormatted = req.body.fechaActualChile;

    try {
        // Verificar si el RUT existe en la tabla personalinterno
        const rutExistente = await db.query('SELECT COUNT(*) AS count FROM personalinterno WHERE RUTPI = ?', [rutPI]);
        const count = rutExistente[0][0].count;
        if (count > 0) {
            // El RUT ya existe, continuar con la inserción en las otras tablas
            // insert en la tabla registro
            await db.query('INSERT INTO registros (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, SELLO, ESTADO, CHEQUEO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePI, apellidoPI, rutPI, patentePI, rolPI, observacionesPI, guiadespachoPI, fechaActualChileFormatted, selloCA, estado, chequeo]);

            // insert into logs
            await db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePI, apellidoPI, rutPI, patentePI, rolPI, observacionesPI, guiadespachoPI, fechaActualChileFormatted, estado]);

            res.send('Entrada/salida registrada correctamente');
            return;
        }

        // El RUT no existe, insertarlo en la tabla personalinterno
        await db.query('INSERT INTO personalinterno (RUTPI, nombrePI, apellidoPI, vehiculoPI, colorPI, patentePI, rolPI, estadoPI) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [rutPI, nombrePI, apellidoPI, vehiculoPI, colorPI, patentePI, rolPI, estadoPI]);

        // insert en la tabla registros
        await db.query('INSERT INTO registros (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, SELLO, ESTADO, CHEQUEO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePI, apellidoPI, rutPI, patentePI, rolPI, observacionesPI, guiadespachoPI, fechaActualChileFormatted, selloCA, estado, chequeo]);

        // insert into logs
        await db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePI, apellidoPI, rutPI, patentePI, rolPI, observacionesPI, guiadespachoPI, fechaActualChileFormatted, estado]);

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
        const q = "SELECT * FROM camiones WHERE RUTCA LIKE ? AND ESTADOCA = 'VIGENTE'";
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
    const patenteCA = req.body.PatenteCA;
    const marcaCA = req.body.MarcaCA;
    const tipoCA = req.body.TipoCA;
    const modeloCA = req.body.ModeloCA;
    const colorCA = req.body.ColorCA;
    const empresaCA = req.body.EmpresaCA;
    const observacionesCA = req.body.ObservacionesCA;
    const guiaDespachoCA = req.body.GuiaDespachoCA;
    const selloCA = req.body.SelloCA;
    const chequeo = "NO";
    const estado = "INGRESO"
    const estadoCA = "VIGENTE";
    const rolCA = "CAMION";
    const fechaActualChileFormatted = req.body.fechaActualChile;


    try {
        // Verificar si el RUT existe en la tabla personalinterno
        const rutExistente = await db.query('SELECT COUNT(*) AS count FROM camiones WHERE RUTCA = ?', [rutCA]);
        const count = rutExistente[0][0].count;
        if (count > 0) {
            // El RUT ya existe, continuar con la inserción en las otras tablas
            // insert en la tabla registro
            await db.query('INSERT INTO registros (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, SELLO, ESTADO, CHEQUEO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [choferCA, apellidochoferCA, rutCA, patenteCA, rolCA, observacionesCA, guiaDespachoCA, fechaActualChileFormatted, selloCA, estado, chequeo]);
            // insert into logs
            await db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, SELLO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [choferCA, apellidochoferCA, rutCA, patenteCA, rolCA, observacionesCA, guiaDespachoCA, selloCA, fechaActualChileFormatted, estado]);

            res.send('Entrada/salida registrada correctamente');
            return;
        }

        // El RUT no existe, insertarlo en la tabla camiones
        await db.query('INSERT INTO camiones (CHOFERCA, APELLIDOCHOFERCA, RUTCA, PATENTECA, MARCACA, TIPOCA, MODELOCA, COLORCA, EMPRESACA, ESTADOCA) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [choferCA, apellidochoferCA, rutCA, patenteCA, marcaCA, tipoCA, modeloCA, colorCA, empresaCA, estadoCA]);

        // insert en la tabla registros
        await db.query('INSERT INTO registros (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO , FECHAINGRESO, SELLO, ESTADO, CHEQUEO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [choferCA, apellidochoferCA, rutCA, patenteCA, rolCA, observacionesCA, guiaDespachoCA, fechaActualChileFormatted, selloCA, estado, chequeo]);

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
    const selloCA = req.body.SelloCA;
    const estadoCA = "SALIDA";
    const fechaActualUTC = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const fechaActualChile = new Date(fechaActualUTC + 'Z');
    fechaActualChile.setHours(fechaActualChile.getHours());

    const fechaActualChileFormatted = fechaActualChile.toISOString().slice(0, 19).replace('T', ' ');

    try {

        await db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, SELLO, FECHASALIDA, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [personal, apellido, rut, patente, rol, observaciones, guiadespacho, selloCA, fechaActualChileFormatted, estadoCA]);

        // await db.query('UPDATE registros SET ESTADO = ? WHERE IDR = ?', ['SALIDA', IDR]);
        await db.query('DELETE FROM registros WHERE IDR = ?', [IDR]);

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
    db.query('UPDATE registros SET ESTADO = ?, FECHASALIDA = ? WHERE IDR = ?', ['SALIDA', fechaSalida, IDR], (err, result) => {
        if (err) {
            console.error('Error al marcar salida:', err);
            res.status(500).send('Error al marcar salida');
            return;
        }

        console.log('Salida registrada correctamente:', result);
        res.send('Salida registrada correctamente');
    });
});




// GESTION HOME

app.get("/TopBox", async (req, res) => {
    try {
        const data = await db.query("SELECT * FROM logs");
        res.json(data);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});
app.get("/ChartBox", async (req, res) => {
    try {
        const data = await db.query("SELECT * FROM registros");
        res.json(data);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});

