const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const router = express.Router();
const { check, validationResult } = require('express-validator');

//import user schema
const User = require('../../models/User');

//@route    POST api/users
//@desc     Register user
//@access   Public
router.post(
  '/',
  [
    //registration validations
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    //check if validation result array is empty, if not...
    if (!errors.isEmpty()) {
      //return a status 400, and show me the errors
      return res.status(400).json({ errors: errors.array() });
    }

    //destructure body params for ease of use
    const { name, email, password } = req.body;

    try {
      //See if user exists
      let user = await User.findOne({ email });
      //if it does...
      if (user) {
        //send status 400 and return the error
        return res
          .status(400)
          .json({ errors: [{ message: 'User already exists' }] });
      }

      //get user gravatar(based on email)
      const avatar = gravatar.url(email, {
        s: '200', //size
        r: 'pg', //rating (pg=no nudity)
        d: 'mm', //default
      });

      //create new user using Mongoose Schema
      user = new User({
        name,
        email,
        avatar,
        password,
      });

      //ecrypt passy using bcrypt
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      //save user in DB
      await user.save();

      //return JWT
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) {
            throw err;
          } else {
            res.json({ token });
          }
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
