// authController.js
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/auth.middlewares");
const bcrypt = require("bcryptjs");


// Creating User Account
const handleUserSignUp = async (req, res) => {
  try {
    const { email, rollNo } = req.body;

    // Check if email already exists
    const existingEmail = await userModel.findOne({ email: { $eq: email } });
    if (existingEmail) {
      logger.warn(`Signup attempt failed: Email already exists - ${email}`);
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check if roll number already exists
    const existingRollNo = await userModel.findOne({ rollNo: { $eq: rollNo } });
    if (existingRollNo) {
      logger.warn(`Signup attempt failed: Roll number already exists - ${rollNo}`);
      return res.status(400).json({ message: "Roll number already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create new user
    const user = new userModel({ ...req.body, password: hashedPassword });
    await user.save();

    logger.info(`New user registered: ${email}`);
    // Send success response
    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    logger.error(`Error during registration for ${req.body.email}: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

// Login User Account
const handleUserLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await userModel.findOne({ email: { $eq: email } });
    if (!user) {
      logger.warn(`Failed login attempt: Invalid email - ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Failed login attempt: Incorrect password for email - ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Send success response
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 3600000,
    });
    
    logger.info(`User logged in: ${email}`);
    res.status(200).json({ message: "Logged in successfully", user, token });
  } catch (err) {
    logger.error(`Error during login for ${req.body.email}: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Alumni Data
async function updateUserById(req, res) {
  try {
    const rollNo = req.params.id;
    const user = await userModel.findOneAndUpdate({ rollNo }, req.body, {
      new: true,
    });
    
    logger.info(`User data updated for Roll No: ${rollNo}`);
    res.send(user);
  } catch (err) {
    logger.error(`Error updating user with Roll No: ${req.params.id}: ${err.message}`);
    res.status(404).send(err);
  }
}

// Delete Alumni Data
async function deleteUserById(req, res) {
  try {
    const rollNo = req.params.id;
    const user = await userModel.findOneAndDelete({ rollNo });
    if (!user) {
      logger.warn(`Delete attempt failed: User doesn't exist with Roll No: ${rollNo}`);
      return res.status(404).send("User doesn't exist");
    }

    logger.info(`User deleted: Roll No - ${rollNo}`);
    res.send(user);
  } catch (err) {
    logger.error(`Error deleting user with Roll No: ${req.params.id}: ${err.message}`);
    res.status(404).send(err);
  }
}

// Get Alumni By Roll No
async function getAlumniById(req, res) {
  try {
    const rollNo = req.params.id;
    const user = await userModel.findOne({ rollNo });
    if (!user) {
      logger.warn(`Get attempt failed: User doesn't exist with Roll No: ${rollNo}`);
      return res.status(404).send("User doesn't exist");
    }
    
    logger.info(`User data retrieved: Roll No - ${rollNo}`);
    res.send(user);
  } catch (err) {
    logger.error(`Error retrieving user with Roll No: ${req.params.id}: ${err.message}`);
    res.status(404).send(err);
  }
}

// Logout User
async function logoutUser(req, res) {
  try {
    res.clearCookie("jwt");
    logger.info(`User logged out: ${req.user?.email || 'Unknown user'}`);
    res.send("Logged Out");
  } catch (err) {
    logger.error(`Error during logout: ${err.message}`);
    res.status(500).send(err);
  }
}

module.exports = {
  handleUserSignUp,
  handleUserLogin,
  updateUserById,
  deleteUserById,
  getAlumniById,
  logoutUser,
};
