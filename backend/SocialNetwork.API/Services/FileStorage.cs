using Microsoft.AspNetCore.Hosting;

namespace SocialNetwork.API.Services
{
    public class FileStorage
    {
        private readonly IWebHostEnvironment _env;

        public FileStorage(IWebHostEnvironment env)
        {
            _env = env;
        }

        public void DeletePostImage(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                return;

            var fullPath = Path.Combine(
                _env.WebRootPath,
                "uploads",
                relativePath.Replace("/", Path.DirectorySeparatorChar.ToString())
            );

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }
    }
}
