/**
 * Validation Middleware
 * Lightweight validators for auth and prediction inputs.
 * Use as middleware arrays on individual routes if needed.
 */

/**
 * Validate that required body fields are present and non-empty.
 * Usage: validateBody(['email', 'password'])
 */
const validateBody = (fields) => (req, res, next) => {
  const missing = fields.filter(
    (f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === ""
  );
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
  }
  next();
};

/**
 * Validate prediction feature ranges.
 */
const validatePredictionFeatures = (req, res, next) => {
  const rules = {
    attendance:       { min: 0,   max: 100 },
    grade_avg:        { min: 0,   max: 100 },
    assignments:      { min: 0,   max: 100 },
    engagement:       { min: 0,   max: 100 },
    prev_gpa:         { min: 0.0, max: 4.0 },
    study_hours:      { min: 0,   max: 12  },
    participation:    { min: 0,   max: 10  },
    missed_deadlines: { min: 0,   max: 7   }
  };

  const errors = [];
  for (const [field, { min, max }] of Object.entries(rules)) {
    const val = parseFloat(req.body[field]);
    if (isNaN(val)) {
      errors.push(`${field} must be a number`);
    } else if (val < min || val > max) {
      errors.push(`${field} must be between ${min} and ${max} (got ${val})`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }
  next();
};

module.exports = { validateBody, validatePredictionFeatures };
