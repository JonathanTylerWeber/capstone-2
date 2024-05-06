"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
// const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class User {
  static async getPrompts(username) {
    // Query the database to retrieve prompts associated with the given username
    const promptsRes = await db.query(
      `SELECT id, username, prompt, rating, type, adj, rewrite
       FROM prompts
       WHERE username = $1`,
      [username]
    );

    // If no prompts are found, throw a NotFoundError
    if (promptsRes.rows.length === 0) {
      throw new NotFoundError(`No prompts found for user: ${username}`);
    }

    // Return the array of prompts
    return promptsRes.rows;
  }



  /** authenticate user with username, password.
   *
   * Returns { username, email }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
      `SELECT username,
                  password,
                  email
           FROM users
           WHERE username = $1`,
      [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, email }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
    { username, password, email }) {
    const duplicateCheck = await db.query(
      `SELECT username
           FROM users
           WHERE username = $1`,
      [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users
           (username,
            password,
            email)
           VALUES ($1, $2, $3)
           RETURNING username, email`,
      [
        username,
        hashedPassword,
        email,
      ],
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, email }, ...]
   **/

  static async findAll() {
    const result = await db.query(
      `SELECT username,
                  email
           FROM users
           ORDER BY username`,
    );

    return result.rows;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, email, prompts }
   *   where prompts is { id, prompt, type, adjectives, response, rating }
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
      `SELECT username,
                  email
           FROM users
           WHERE username = $1`,
      [username],
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    // const userApplicationsRes = await db.query(
    //   `SELECT a.job_id
    //        FROM applications AS a
    //        WHERE a.username = $1`, [username]);

    // user.applications = userApplicationsRes.rows.map(a => a.job_id);
    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin }
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const result = await db.query(`UPDATE users 
      WHERE username = $1 
      RETURNING username,
                email`, [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
      `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
      [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }


}


module.exports = User;
