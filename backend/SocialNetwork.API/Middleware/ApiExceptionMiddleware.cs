using Microsoft.Data.SqlClient;
using System.Net;

namespace SocialNetwork.API.Middleware
{
    public sealed class ApiExceptionMiddleware : IMiddleware
    {
        private readonly ILogger<ApiExceptionMiddleware> _logger;

        public ApiExceptionMiddleware(ILogger<ApiExceptionMiddleware> logger)
        {
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            try
            {
                await next(context);
            }
            catch (SqlException ex)
            {
                var (status, code) = MapSql(ex);

                _logger.LogWarning(ex, "SQL error {Number}: {Message}", ex.Number, ex.Message);

                context.Response.StatusCode = (int)status;
                context.Response.ContentType = "application/json";

                await context.Response.WriteAsJsonAsync(new
                {
                    error = code,
                    message = Clean(ex.Message)
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation: {Message}", ex.Message);

                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                context.Response.ContentType = "application/json";

                await context.Response.WriteAsJsonAsync(new
                {
                    error = "bad_request",
                    message = ex.Message
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized: {Message}", ex.Message);

                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                context.Response.ContentType = "application/json";

                await context.Response.WriteAsJsonAsync(new
                {
                    error = "unauthorized",
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error");

                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                context.Response.ContentType = "application/json";

                await context.Response.WriteAsJsonAsync(new
                {
                    error = "server_error",
                    message = "Unexpected error."
                });
            }
        }

        private static (HttpStatusCode status, string code) MapSql(SqlException ex)
        {
            return ex.Number switch
            {
                50001 => (HttpStatusCode.Forbidden, "blocked"),
                50003 => (HttpStatusCode.Forbidden, "forbidden"), 
                50004 => (HttpStatusCode.NotFound, "not_found"),
                50010 => (HttpStatusCode.NotFound, "not_found"),
                50011 => (HttpStatusCode.Forbidden, "forbidden"),

                2627 or 2601 => (HttpStatusCode.Conflict, "conflict"),
                547 => (HttpStatusCode.Conflict, "constraint_violation"),

                _ => (HttpStatusCode.BadRequest, "sql_error")
            };
        }


        private static string Clean(string message)
        {
            return message.Replace("The statement has been terminated.", "").Trim();
        }
    }
}
