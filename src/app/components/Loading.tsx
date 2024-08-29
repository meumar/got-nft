import { Spinner } from "@nextui-org/spinner";
const LoadingComponent = () => {
  return (
    <div className="text-center mb-3">
      <div role="status">
        <Spinner color="warning" />
      </div>
    </div>
  );
};

export default LoadingComponent;
