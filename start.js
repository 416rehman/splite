module.exports = {
  apps : [{
    name: "Splite",
    script: "./src/Client.js",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}