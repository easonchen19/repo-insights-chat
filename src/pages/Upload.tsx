import UploadButton from "@/components/UploadButton";
import ProtectedRoute from "@/components/ProtectedRoute";

const Upload = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center px-6 pt-16">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Upload Your Project
            </h1>
            <p className="text-muted-foreground text-lg">
              Select files or folders to upload and analyze your codebase
            </p>
          </div>
          <UploadButton variant="hero" size="default" />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Upload;