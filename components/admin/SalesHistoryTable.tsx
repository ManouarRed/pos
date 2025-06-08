
import React from 'react';
import { SubmittedSale, SaleItemRecord } from '../../types';
import { Button } from '../common/Button';
import { PencilIcon } from '../icons/PencilIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { ReceiptIcon } from '../icons/ReceiptIcon';

interface SalesHistoryTableProps {
  sales: SubmittedSale[];
  onEdit: (sale: SubmittedSale) => void;
}

export const SalesHistoryTable: React.FC<SalesHistoryTableProps> = ({ sales, onEdit }) => {
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (sales.length === 0) {
    return <p className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-md">No sales records found.</p>;
  }

  return (
    <div className="flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300" aria-label="Submitted Sales">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    <div className="flex items-center">
                      <ReceiptIcon className="h-4 w-4 mr-1 text-gray-500" /> Sale ID
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                     <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" /> Date
                     </div>
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Products</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total Discount (€)</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Payment Method</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total (€)</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-center text-sm font-semibold text-gray-900 min-w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sales.map((sale) => {
                  const totalDiscountForSale = sale.items.reduce((sum, item) => sum + item.discount, 0);
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-gray-700 sm:pl-6 align-top">
                        {/* Show a more user-friendly part of the ID, e.g., last 8 chars or a sequence number if available */}
                        {sale.id.substring(sale.id.length - 8)} 
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 align-top">
                        {formatDate(sale.submissionDate)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 align-top">
                        {sale.items.length > 0 ? (
                          <ul className="space-y-3"> {/* Increased space for better image display */}
                            {sale.items.map((item: SaleItemRecord, index: number) => (
                              <li key={index} className="text-xs border-b border-gray-100 pb-2 last:border-b-0 last:pb-0 flex items-start gap-2">
                                <img 
                                  src={item.image} 
                                  alt={item.title} 
                                  className="w-10 h-10 object-cover rounded-md flex-shrink-0" 
                                  onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40?text=No+Img')} // Fallback image
                                />
                                <div className="flex-grow">
                                  <p className="font-medium text-gray-700">{item.title}</p>
                                  <p>Code: {item.code}</p>
                                  {item.selectedSize && <p>Size: {item.selectedSize}</p>}
                                  <p>Qty: {item.quantity} @ €{item.unitPrice.toFixed(2)}</p>
                                  {item.discount > 0 && <p className="text-orange-600">Item Discount: €{item.discount.toFixed(2)}</p>}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span>No items</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 align-top">
                        €{totalDiscountForSale.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 align-top">
                        {sale.paymentMethod}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-indigo-600 align-top">
                        €{sale.totalAmount.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap py-4 pl-3 pr-4 text-center text-sm font-medium sm:pr-6 align-top">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(sale)} aria-label={`Edit sale ${sale.id}`} className="group inline-flex items-center">
                          <PencilIcon className="text-indigo-600 group-hover:text-indigo-800 h-5 w-5" />
                          <span className="ml-1 text-xs text-indigo-600 group-hover:text-indigo-800">Edit</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};