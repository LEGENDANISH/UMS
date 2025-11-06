import * as z from "zod"; // ✅ reliable import

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    next();
  } catch (error) {
    // ✅ Detect if it's really a ZodError
    if (error instanceof z.ZodError || error.name === "ZodError") {
      const details = Array.isArray(error.errors)
        ? error.errors.map((e) => ({
            path: e.path ? e.path.join(".") : "(unknown)",
            message: e.message || "Invalid input",
          }))
        : [];

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details,
      });
    }

    console.error("Unexpected validation middleware error:", error);
    res.status(500).json({
      success: false,
      error: "Unexpected validation middleware error",
    });
  }
};
