module.exports = {
  
  versionFile:{
    output:'versionFile'
  },
  localPath: 'dist',
  deploy : {
    production : [{
      user : 'root',
      host : '39.106.128.105',
      password: 'abc132##',
      port: 22,
      ref  : 'origin/master',
      repo : 'git@github.com:rocky-one/webpack3-react-redux-reactRouter4.git',
      path : '/home/www/htdocs',
    }],
    dev : [{
      user : 'root',
      host : '39.106.128.105',
      password: 'abc132##',
      ref  : 'origin/master',
      port: 22,
      repo : 'git@github.com:rocky-one/webpack3-react-redux-reactRouter4.git',
      path : '/home/www/htdocs',
      localPath: 'dist',
      env  : {
        NODE_ENV: 'dev'
      }
    }]
  }
};
