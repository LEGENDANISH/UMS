// src/controllers/course.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to restrict updates to admins or the course teacher
const canManageCourse = (req, courseTeacherId) => {
  const user = req.user;
  return (
    user.role === 'ADMIN' ||
    (user.role === 'TEACHER' && user.teacher?.id === courseTeacherId)
  );
};

// ------------------------------------------------------
// GET ALL COURSES
// ------------------------------------------------------
const getAllCourses = async (req, res) => {
  try {
    const { semester, departmentId, teacherId } = req.query;
    const where = {};
    if (semester) where.semester = semester;
    if (departmentId) where.departmentId = departmentId;
    if (teacherId) where.teacherId = teacherId;

    const courses = await prisma.course.findMany({
      where,
      include: {
        department: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true, employeeId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

// ------------------------------------------------------
// CREATE COURSE + AUTO-ENROLL STUDENTS
// ------------------------------------------------------
const createCourse = async (req, res) => {
  const { name, code, credits, description, semester, year, departmentId, teacherId } = req.body;

  try {
    // Step 1: Create the new course
    const course = await prisma.course.create({
      data: {
        name,
        code,
        credits,
        description,
        semester,
        year,
        departmentId,
        teacherId,
      },
    });

    // Step 2: Find all students in the same department
    const students = await prisma.student.findMany({
      where: { departmentId },
      select: { id: true },
    });

    // Step 3: Auto-enroll each student in this course
    if (students.length > 0) {
      const enrollmentsData = students.map((student) => ({
        studentId: student.id,
        courseId: course.id,
        semester,
        year,
      }));

      await prisma.enrollment.createMany({
        data: enrollmentsData,
        skipDuplicates: true, // Avoid duplicates
      });
    }

    res.status(201).json({
      success: true,
      message: `Course created and ${students.length} student(s) auto-enrolled.`,
      course,
    });
  } catch (err) {
    console.error('Error creating course:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    res.status(500).json({ error: 'Failed to create course' });
  }
};

// ------------------------------------------------------
// GET COURSE BY ID
// ------------------------------------------------------
const getCourseById = async (req, res) => {
  const { id } = req.params;
  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        department: true,
        teacher: true,
      },
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
};

// ------------------------------------------------------
// UPDATE COURSE
// ------------------------------------------------------
const updateCourse = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    if (!canManageCourse(req, course.teacherId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.course.update({
      where: { id },
      data: updateData,
    });

    res.json(updated);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    res.status(500).json({ error: 'Failed to update course' });
  }
};

// ------------------------------------------------------
// DELETE COURSE
// ------------------------------------------------------
const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.course.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

// ------------------------------------------------------
// RELATED DATA FETCHERS
// ------------------------------------------------------
const getEnrollments = async (req, res) => {
  const { id } = req.params;
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: id },
    include: {
      student: {
        include: { user: { select: { email: true } } },
      },
    },
  });
  res.json(enrollments);
};

const getAttendances = async (req, res) => {
  const { id } = req.params;
  const attendances = await prisma.attendance.findMany({
    where: { courseId: id },
    include: { student: true, teacher: true },
  });
  res.json(attendances);
};

const getGrades = async (req, res) => {
  const { id } = req.params;
  const grades = await prisma.grade.findMany({
    where: { courseId: id },
    include: { student: true, teacher: true },
  });
  res.json(grades);
};

const getAssignments = async (req, res) => {
  const { id } = req.params;
  const assignments = await prisma.assignment.findMany({
    where: { courseId: id },
    include: { teacher: true, submissions: true },
  });
  res.json(assignments);
};

const getTimetable = async (req, res) => {
  const { id } = req.params;
  const timetable = await prisma.timetable.findMany({
    where: { courseId: id },
  });
  res.json(timetable);
};

// ------------------------------------------------------
// EXPORTS
// ------------------------------------------------------
module.exports = {
  getAllCourses,
  createCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
  getEnrollments,
  getAttendances,
  getGrades,
  getAssignments,
  getTimetable,
};
