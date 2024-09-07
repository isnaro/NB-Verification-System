const express = require('express');
const server = express();

server.all('/', (req, res) => {
    res.send('Bot is running!');
});

function keepAlive() {
    // Use process.env.PORT if available, otherwise fallback to 3000
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`Server is ready on port ${port}.`);
    });
}

module.exports = keepAlive;
