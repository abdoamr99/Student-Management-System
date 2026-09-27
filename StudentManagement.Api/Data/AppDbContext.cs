using Microsoft.EntityFrameworkCore;
using StudentManagement.Api.Models;

namespace StudentManagement.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Student> Students => Set<Student>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var student = modelBuilder.Entity<Student>();
        student.ToTable("Students");
        student.HasKey(item => item.Id);
        student.Property(item => item.FirstName).IsRequired().HasMaxLength(80);
        student.Property(item => item.LastName).IsRequired().HasMaxLength(80);
        student.Property(item => item.Email).IsRequired().HasMaxLength(255);
        student.Property(item => item.PhoneNumber).HasMaxLength(30);
        student.Property(item => item.Department).IsRequired().HasMaxLength(120);
        student.Property(item => item.EnrollmentDate).HasDefaultValueSql("GETUTCDATE()");
        student.HasIndex(item => item.Email).IsUnique();
    }
}
