const express = require('express');
const sql = require('mssql');
const config = require('./config');

const app = express();
const port = 3000;

sql.connect(config, err => {
  if (err) console.log(err);

  app.get('/data', async (req, res) => {
    try {
      const result = await sql.query`SELECT * FROM your_table`;
      res.json(result.recordset);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
