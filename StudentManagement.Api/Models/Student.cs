using System.ComponentModel.DataAnnotations;

namespace StudentManagement.Api.Models;

public sealed class Student
{
    public int Id { get; set; }

    [Required, StringLength(80)]
    public string FirstName { get; set; } = string.Empty;

    [Required, StringLength(80)]
    public string LastName { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(255)]
    public string Email { get; set; } = string.Empty;

    [StringLength(30)]
    public string? PhoneNumber { get; set; }

    [DataType(DataType.Date)]
    public DateTime DateOfBirth { get; set; }

    [Required, StringLength(120)]
    public string Department { get; set; } = string.Empty;

    public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow;
}
