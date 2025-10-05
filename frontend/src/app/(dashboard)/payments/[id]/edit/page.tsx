import EditPaymentForm from './EditPaymentForm';

interface EditPaymentPageProps {
  params: {
    id: string;
  };
}

export default function EditPaymentPage({ params }: EditPaymentPageProps) {
  console.log('EditPaymentPage received params:', params);
  
  if (!params.id) {
    console.error('No payment ID provided in URL params');
    return (
    <div className="flex-1 p-8">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Edit Payment</h1>
          </div>
          <div className="text-white">Invalid payment ID</div>
        </div>
      </div>
    );
  }

  return <EditPaymentForm paymentId={{ id: params.id }} />;
} 