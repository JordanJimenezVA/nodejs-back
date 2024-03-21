import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import mysql from "mysql";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { createPool } from 'mysql2/promise';


const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;



const app = express();

export const db = createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE
})
// const db = mysql.createConnection({
//     host: DB_HOST   ,
//     port: DB_PORT,
//     user: DB_USER,
//     password: DB_PASSWORD,
//     database: DB_DATABASE
// });

app.use(express.json());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(cors({
    origin: ["http://localhost:5173", "https://test-lyart-zeta.vercel.app/"],
    methods: ["POST", "GET"],
    credentials: true,
}));

app.listen(8800, () => {
    console.log("Server connected");
});


app.get("/TablaIngreso", (req, res) => {
    const q = "SELECT * FROM registros WHERE ESTADO = 'INGRESO'"
    db.query(q, (err, re) => {
        if (err) return res.json(err)
        return res.json(re)
    })
});

app.get("/Logs", (req, res) => {
    const q = "SELECT * FROM logs"
    db.query(q, (err, re) => {
        if (err) return res.json(err)
        return res.json(re)
    })
});

app.get("/Personal%20Interno", (req, res) => {
    const q = "SELECT * FROM personalinterno"
    db.query(q, (err, pi) => {
        if (err) return res.json(err)
        return res.json(pi)
    })
})

app.get("/Personal%20Externo", (req, res) => {
    const q = "SELECT * FROM personalexterno"
    db.query(q, (err, pe) => {
        if (err) return res.json(err)
        return res.json(pe)
    })
})

// app.get("/Camiones", (req, res) => {
//     const q = "SELECT * FROM camiones;"
//     db.query(q, (err, ca) => {
//         if (err) return res.json(err)
//         return res.json(ca)
//     })
// })

app.get("/Camiones", async (req, res) => {
    try {
        const [rows, fields] = await db.query("SELECT * FROM camiones");
        res.json(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).json({ error: 'Error al ejecutar la consulta' });
    }
});

// app.get("/empresas", (req, res) => {
//     const q = "SELECT * FROM empresa"
//     db.query(q, (err, e) => {
//         if (err) return res.json(err)
//         return res.json(e)
//     })
// });

app.get("/FormularioSalida/:IDR", (req, res) => {
    const { IDR } = req.params;
    const q = "SELECT * FROM registros WHERE IDR = ?"
    db.query(q, [IDR], (err, r) => {
        if (err) return res.json(err)
        return res.json(r)
    })
});

app.get('/FormularioPersonalExterno/suggestions', (req, res) => {
    const { query } = req.query;
    const q = "SELECT * FROM personalexterno WHERE RUTPE LIKE ?";
    db.query(q, [`%${query}%`], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener sugerencias' });
        }
        const suggestions = results.map((result) => result.RUTPE);

        res.json({ suggestions });
    });
});

app.get('/FormularioPersonalExterno/suggestion/:RUTPE', (req, res) => {
    const { RUTPE } = req.params;
    const q = "SELECT * FROM personalexterno WHERE RUTPE = ?";
    db.query(q, [RUTPE], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener detalles del Rut' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Rut no encontrado' });
        }
        const { NOMBREPE, APELLIDOPE, VEHICULOPE, COLORPE, PATENTEPE, ROLPE, EMPRESAPE } = result[0];
        res.json({ NOMBREPE, APELLIDOPE, VEHICULOPE, COLORPE, PATENTEPE, ROLPE, EMPRESAPE });
    });
});


app.get('/FormularioPersonalInterno/suggestions', (req, res) => {
    const { query } = req.query;
    const q = "SELECT * FROM personalinterno WHERE RUTPI LIKE ?";
    db.query(q, [`%${query}%`], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener sugerencias' });
        }
        const suggestions = results.map((result) => result.RUTPI);

        res.json({ suggestions });
    });
});

app.get('/FormularioPersonalInterno/suggestion/:RUTPI', (req, res) => {
    const { RUTPI } = req.params;
    const q = "SELECT * FROM personalinterno WHERE RUTPI = ?";
    db.query(q, [RUTPI], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener detalles del Rut' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Rut no encontrado' });
        }
        const { NOMBREPI, APELLIDOPI, VEHICULOPI, COLORPI, PATENTEPI, ROLPI } = result[0];
        res.json({ NOMBREPI, APELLIDOPI, VEHICULOPI, COLORPI, PATENTEPI, ROLPI });
    });
});
app.get('/FormularioCamiones/suggestions', (req, res) => {
    const { query } = req.query;
    const q = "SELECT * FROM camiones WHERE RUTCA LIKE ?";
    db.query(q, [`%${query}%`], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener sugerencias' });
        }
        const suggestions = results.map((result) => result.RUTCA);

        res.json({ suggestions });
    });
});

app.get('/FormularioCamiones/suggestion/:RUTCA', (req, res) => {
    const { RUTCA } = req.params;
    const q = "SELECT * FROM camiones WHERE RUTCA = ?";
    db.query(q, [RUTCA], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener detalles del Rut' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Rut no encontrado' });
        }
        const { CHOFERCA, APELLIDOCHOFERCA, RUTCA, PEONETACA, PATENTECA, MARCACA, TIPOCA, MODELOCA, COLORCA, EMPRESACA, OBSERVACIONESCA, GUIADESPACHOCA } = result[0];
        res.json({ CHOFERCA, APELLIDOCHOFERCA, RUTCA, PEONETACA, PATENTECA, MARCACA, TIPOCA, MODELOCA, COLORCA, EMPRESACA, OBSERVACIONESCA, GUIADESPACHOCA });
    });
});


app.post("/Personal%20Interno", (req, res) => {
    const rutPI = req.body.rutPI;
    const nombrePI = req.body.NombrePI;
    const apellidoPI = req.body.ApellidoPI;
    const vehiculoPI = req.body.VehiculoPI;
    const colorPI = req.body.ColorPI;
    const patentePI = req.body.PatentePI;
    const rolPI = req.body.RolPI;

    db.query('INSERT INTO personalinterno (RUTPI, nombrePI, apellidoPI, vehiculoPI, colorPI, patentePI, rolPI) VALUES (?, ?, ?, ?, ?, ?, ?)', [rutPI, nombrePI, apellidoPI, vehiculoPI, colorPI, patentePI, rolPI], (err, result) => {
        if (err) {
            console.error('Error al Registrar Personal Interno', err);
            res.status(500).send('Error al Registrar Personal Interno');
            return;
        }
        res.send('Entrada/salida registrada correctamente');
    });
});


app.post("/FormularioPersonalInterno", (req, res) => {
    const rutPI = req.body.rutPI;
    const nombrePI = req.body.NombrePI;
    const apellidoPI = req.body.ApellidoPI;
    const vehiculoPI = req.body.VehiculoPI;
    const colorPI = req.body.ColorPI;
    const patentePI = req.body.PatentePI;
    const rolPI = req.body.RolPI;
    const guiadespachoPI = "-";
    const observacionesPI = "-";
    const estadoPI = "VIGENTE";
    const estado = "INGRESO";
    const fechaActualUTC = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const fechaActualChile = new Date(fechaActualUTC + 'Z');
    fechaActualChile.setHours(fechaActualChile.getHours() - 3);
    const fechaActualChileFormatted = fechaActualChile.toISOString().slice(0, 19).replace('T', ' ');

    // insert en la tabla personalinterno
    db.query('INSERT INTO personalinterno (RUTPI, nombrePI, apellidoPI, vehiculoPI, colorPI, patentePI, rolPI, estadoPI) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [rutPI, nombrePI, apellidoPI, vehiculoPI, colorPI, patentePI, rolPI, estadoPI], (err, result) => {
        if (err) {
            console.error('Error al Registrar Personal Interno:', err);
            res.status(500).send('Error al Registrar Personal Interno');
            return;
        }

        // insert en la tabla registros
        db.query('INSERT INTO registros (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePI, apellidoPI, rutPI, patentePI, rolPI, '-', '-', fechaActualChileFormatted, estado], (err, result) => {
            if (err) {
                console.error('Error al Registrar Ingreso:', err);
                res.status(500).send('Error al Registrar Ingreso');
                return;
            }

            console.log('Nuevo registro insertado:', result);
            res.send('Entrada/salida registrada correctamente');
        });


        // insert en la tabla logs
        db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePI, apellidoPI, rutPI, patentePI, rolPI, '-', '-', fechaActualChileFormatted, estado], (err, result) => {
            if (err) {
                console.error('Error al ingresar log:', err);
                res.status(500).send('Error al ingresar log');
                return;
            }
        });

    });
});

app.post("/FormularioPersonalExterno", (req, res) => {
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

    // insert en la tabla personalexterno
    db.query('INSERT INTO personalexterno (RUTPE, nombrePE, apellidoPE, vehiculoPE, colorPE, patentePE, empresaPE, rolPE, estadoPE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [rutPE, nombrePE, apellidoPE, vehiculoPE, colorPE, patentePE, empresaPE, rolPE, estadoPE], (err, result) => {
        if (err) {
            console.error('Error al Registrar Personal Externo:', err);
            res.status(500).send('Error al Registrar Personal Externo');
            return;
        }

        // insert en la tabla registros
        db.query('INSERT INTO registros (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePE, apellidoPE, rutPE, patentePE, rolPE, observacionesPE, guiadespachoPE, fechaActualChileFormatted, estado], (err, result) => {
            if (err) {
                console.error('Error al Registrar Ingreso:', err);
                res.status(500).send('Error al Registrar Ingreso');
                return;
            }
            res.send('Entrada/salida registrada correctamente');
        });
        // insert into logs
        db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombrePE, apellidoPE, rutPE, patentePE, rolPE, observacionesPE, '-', fechaActualChileFormatted, estado], (err, result) => {
            if (err) {
                console.error('Error al ingresar log:', err);
                res.status(500).send('Error al ingresar log');
                return;
            }
        });
    });
});

app.post("/FormularioCamiones", (req, res) => {

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

    // insert en la tabla camiones
    db.query('INSERT INTO camiones (CHOFERCA, APELLIDOCHOFERCA, RUTCA, PEONETACA, PATENTECA, MARCACA, TIPOCA, MODELOCA, COLORCA, EMPRESACA, ESTADOCA) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [choferCA, apellidochoferCA, rutCA, peonetaCA, patenteCA, marcaCA, tipoCA, modeloCA, colorCA, empresaCA, observacionesCA, guiaDespachoCA, estadoCA], (err, result) => {
        if (err) {
            console.error('Error al Registrar Camion:', err);
            res.status(500).send('Error al Registrar Camion');
            return;
        }

        // insert en la tabla registros
        db.query('INSERT INTO registros (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [choferCA, apellidochoferCA, rutCA, patenteCA, rolCA, observacionesCA, guiaDespachoCA, fechaActualChileFormatted, estado], (err, result) => {
            if (err) {
                console.error('Error al Registrar Ingreso:', err);
                res.status(500).send('Error al Registrar Ingreso');
                return;
            }

            console.log('Nuevo registro insertado:', result);
            res.send('Entrada/salida registrada correctamente');
        });

        db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHAINGRESO, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [choferCA, apellidochoferCA, rutCA, patenteCA, rolCA, observacionesCA, guiaDespachoCA, fechaActualChileFormatted, estado], (err, result) => {
            if (err) {
                console.error('Error al ingresar log:', err);
                res.status(500).send('Error al ingresar log');
                return;
            }
        });
    });
});


app.post("/FormularioSalida/:IDR", (req, res) => {

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
    // insert en la tabla camiones
    db.query('INSERT INTO logs (PERSONAL, APELLIDO, RUT, PATENTE, ROL, OBSERVACIONES, GUIADESPACHO, FECHASALIDA, ESTADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [personal, apellido, rut, patente, rol, observaciones, guiadespacho, fechaActualChileFormatted, estadoCA], (err, result) => {
        if (err) {
            console.error('Error al ingresar log:', err);
            res.status(500).send('Error al ingresar log');
            return;
        }

        //update en la tabla registros
        db.query('UPDATE registros SET ESTADO = ? WHERE IDR = ?', ['SALIDA', IDR], (err, result) => {
            if (err) {
                console.error('Error al Registrar Salida:', err);
                res.status(500).send('Error al Registrar Salida');
                return;
            }
            res.send('Salida registrada correctamente');
        });
    });
});




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


