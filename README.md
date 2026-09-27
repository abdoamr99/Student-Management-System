# Student Management System

This solution contains two separate parts for the Auspify Internship Task 2 CRUD requirements:

- `StudentManagement.Api`: ASP.NET Core 8 API using the conventional `Models`, `Data`, and `Controllers` folders.
- `Frontend/index.html`: independent Bootstrap 5 client using Fetch API.

## Run the API

1. Confirm SQL Server Express is running and that the Windows account has access to `DESKTOP-OSMEIU4\SQLEXPRESS`.
2. From this folder, run:

```powershell
dotnet restore .\StudentManagement.Api\StudentManagement.Api.csproj
dotnet run --project .\StudentManagement.Api\StudentManagement.Api.csproj
```

The API uses this SQL Server Express instance:

`DESKTOP-OSMEIU4\SQLEXPRESS`

The full connection string is in `StudentManagement.Api/appsettings.json`. EF Core applies the existing migrations automatically on startup, creating `StudentManagementDb` and the `Students` table when needed. Swagger is available at `http://localhost:5073/swagger` in Development.

## Run the frontend

Serve `Frontend/index.html` from a local static server so the browser sends an allowed CORS origin. For example, with VS Code Live Server use port `5500`, then open the displayed page. The frontend files are `index.html`, `style.css`, and `app.js`. The frontend defaults to `http://localhost:5073/api` and supports an optional `window.STUDENT_API_BASE_URL` override if the API runs elsewhere.

If the API still stops with `Cannot generate SSPI context`, open SQL Server Configuration Manager and verify that the `SQL Server (SQLEXPRESS)` service is running, TCP/IP is enabled for `SQLEXPRESS`, and `SQL Server Browser` is running for the named instance. The error is Windows Authentication/SQL Server configuration, not a controller or EF Core error. Microsoft documents this error as an SSPI/Kerberos or SPN authentication problem.

## API endpoints

- `GET /api/students`
- `GET /api/students/{id}`
- `POST /api/students`
- `PUT /api/students/{id}`
- `DELETE /api/students/{id}`
