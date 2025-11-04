// src/controllers/course.controller.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const canManageCourse = (req, courseTeacherId) => {
  const user = req.user;
  return (
    user.role === 'ADMIN' ||
    (user.role === 'TEACHER' && user.teacher?.id === courseTeacherId)
  );
};

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
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

const createCourse = async (req, res) => {
  const { name, code, credits, description, semester, year, departmentId, teacherId } = req.body;

  try {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });

    if (!dept) return res.status(400).json({ error: 'Department not found' });
    if (!teacher) return res.status(400).json({ error: 'Teacher not found' });

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

    res.status(201).json(course);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Foreign key violation (department/teacher)' });
    }
    res.status(500).json({ error: 'Failed to create course' });
  }
};

const getCourseById = async (req, res) => {
  const { id } = req.params;
  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: { department: true, teacher: true },
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
};

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

// --- Relation Endpoints ---

const getEnrollments = async (req, res) => {
  const { id } = req.params;
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: id },
    include: { student: { include: { user: { select: { email: true } } } } },
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
