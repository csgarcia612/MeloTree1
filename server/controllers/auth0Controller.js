const axios = require('axios'),
  index = require('../index');

module.exports = {
  login: (req, res) => {
    const { code } = req.query;
    console.log('***req.query.code :', code);
    const payload = {
      client_id: process.env.REACT_APP_AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      code: req.query.code,
      grant_type: 'authorization_code',
      redirect_uri: `http://${req.headers.host}/auth/callback`
    };

    console.log('***payload: ', payload);

    function codeForAccessToken() {
      console.log('***codeforaccesstoken');

      return axios.post(
        `https://${process.env.REACT_APP_AUTH0_DOMAIN}/oauth/token`,
        payload
      );
    }

    function accessTokenForUserInfo(res) {
      console.log('***accessTokenForUserInfo: ', res.data.access_token);
      return axios.get(
        `https://${process.env.REACT_APP_AUTH0_DOMAIN}/userinfo?access_token=${
          res.data.access_token
        }`
      );
    }

    function storeUserInfo(response) {
      console.log('***user info: ', response.data);
      const user = response.data;
      const db = index.database;
      return db.get_user_auth0([user.sub]).then(newUser => {
        // console.log('testing', user.sub);
        console.log('***newUser Info: ', newUser);

        if (newUser.length) {
          req.session.user = {
            user_id: newUser[0].user_id,
            auth0_id: newUser[0].auth0_id,
            username: newUser[0].username,
            first_name: newUser[0].first_name,
            last_name: newUser[0].last_name,
            email: newUser[0].email,
            image_url: newUser[0].image_url
          };
          res.redirect('/');
        } else {
          let splitName = user.name.split(' ');
          if (splitName.length === 1) {
            splitName.push('Melody');
          } else if (splitName.length < 1) {
            splitName.push('Cadence', 'Melody');
          }
          return db
            .create_user([
              user.sub,
              user.nickname,
              splitName[0],
              splitName[1],
              user.email,
              user.image_url || user.picture
            ])
            .then(newlyCreateUser => {
              req.session.user = newlyCreateUser[0];
              // console.log("req.session", req.session)
              res.redirect('/');
            })
            .catch(error => {
              console.log(('***error in create_user: ', error));
            });
        }
      });
    }

    codeForAccessToken()
      .then(accessTokenForUserInfo)
      .then(storeUserInfo)
      .catch(error => {
        console.log('***error with login: ', error);
        res.status(500).send('something went wrong on the server.');
      });
  },
  logout: (req, res) => {
    req.session.destroy();
    res.send('Logged Out Successfully');
  }
};
