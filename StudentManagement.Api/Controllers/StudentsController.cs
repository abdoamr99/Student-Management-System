using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using StudentManagement.Api.Data;
using StudentManagement.Api.Models;

namespace StudentManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class StudentsController(AppDbContext dbContext, ILogger<StudentsController> logger) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<Student>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Student>>> GetAll(CancellationToken cancellationToken)
    {
        var students = await dbContext.Students
            .AsNoTracking()
            .OrderBy(student => student.LastName)
            .ThenBy(student => student.FirstName)
            .ToListAsync(cancellationToken);

        return Ok(students);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Student), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Student>> GetById(int id, CancellationToken cancellationToken)
    {
        var student = await dbContext.Students
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        return student is null ? NotFound(new { message = $"Student with ID {id} was not found." }) : Ok(student);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Student), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<Student>> Create(Student student, CancellationToken cancellationToken)
    {
        student.Id = 0;
        student.FirstName = student.FirstName.Trim();
        student.LastName = student.LastName.Trim();
        student.Email = student.Email.Trim().ToLowerInvariant();
        student.Department = student.Department.Trim();
        student.PhoneNumber = string.IsNullOrWhiteSpace(student.PhoneNumber) ? null : student.PhoneNumber.Trim();
        student.DateOfBirth = student.DateOfBirth.Date;
        student.EnrollmentDate = DateTime.UtcNow;

        AddBusinessValidationErrors(student);

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            dbContext.Students.Add(student);
            await dbContext.SaveChangesAsync(cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = student.Id }, student);
        }
        catch (DbUpdateException exception) when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            logger.LogWarning("A student with email {Email} already exists.", student.Email);
            return Conflict(new { message = "A student with this email address already exists." });
        }
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(int id, Student student, CancellationToken cancellationToken)
    {
        if (id != student.Id && student.Id != 0)
        {
            return BadRequest(new { message = "The route ID must match the student ID." });
        }

        student.FirstName = student.FirstName.Trim();
        student.LastName = student.LastName.Trim();
        student.Email = student.Email.Trim().ToLowerInvariant();
        student.Department = student.Department.Trim();
        student.PhoneNumber = string.IsNullOrWhiteSpace(student.PhoneNumber) ? null : student.PhoneNumber.Trim();
        student.DateOfBirth = student.DateOfBirth.Date;

        AddBusinessValidationErrors(student);

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var existingStudent = await dbContext.Students.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
            if (existingStudent is null)
            {
                return NotFound(new { message = $"Student with ID {id} was not found." });
            }

            existingStudent.FirstName = student.FirstName;
            existingStudent.LastName = student.LastName;
            existingStudent.Email = student.Email;
            existingStudent.PhoneNumber = student.PhoneNumber;
            existingStudent.DateOfBirth = student.DateOfBirth;
            existingStudent.Department = student.Department;

            await dbContext.SaveChangesAsync(cancellationToken);
            return NoContent();
        }
        catch (DbUpdateException exception) when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            logger.LogWarning("A student with email {Email} already exists.", student.Email);
            return Conflict(new { message = "A student with this email address already exists." });
        }
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var student = await dbContext.Students.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (student is null)
        {
            return NotFound(new { message = $"Student with ID {id} was not found." });
        }

        dbContext.Students.Remove(student);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private void AddBusinessValidationErrors(Student student)
    {
        if (student.DateOfBirth == default)
        {
            ModelState.AddModelError(nameof(Student.DateOfBirth), "Date of birth is required.");
        }
        else if (student.DateOfBirth > DateTime.UtcNow.Date)
        {
            ModelState.AddModelError(nameof(Student.DateOfBirth), "Date of birth cannot be in the future.");
        }
    }
}
