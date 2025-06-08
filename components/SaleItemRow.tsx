
import React from 'react';
import { SaleItem, SizeStock } from '../types';
import { Input } from './common/Input';
import { Select } from './common/Select';
import { Button } from './common/Button';
import { TrashIcon } from './icons/TrashIcon';

interface SaleItemRowProps {
  item: SaleItem;
  index: number;
  onUpdateItem: (index: number, updatedItem: SaleItem) => void;
  onRemoveItem: (index: number) => void;
  // productStock prop is now specific to the selected size, calculated within component
}

export const SaleItemRow: React.FC<SaleItemRowProps> = ({ item, index, onUpdateItem, onRemoveItem }) => {
  
  const selectedSizeStockInfo = item.product.sizes.find(s => s.size === item.selectedSize);
  const currentSizeStock = selectedSizeStockInfo ? selectedSizeStockInfo.stock : 0;
  const isOutOfStock = currentSizeStock === 0 && item.product.sizes.length > 0; // True if selected size exists but has 0 stock

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newQuantity = parseInt(e.target.value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
    }
    // Use currentSizeStock for the limit
    if (newQuantity > currentSizeStock) {
        newQuantity = currentSizeStock;
        if (currentSizeStock > 0) { // Only alert if there was some stock to begin with
            alert(`Max quantity for ${item.product.title} (Size: ${item.selectedSize}) is ${currentSizeStock} due to stock limits.`);
        }
    }
    onUpdateItem(index, { ...item, quantity: newQuantity });
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newDiscount = parseFloat(e.target.value);
    if (isNaN(newDiscount) || newDiscount < 0) {
      newDiscount = 0;
    }
    const maxDiscount = item.product.price * item.quantity;
    if (newDiscount > maxDiscount) newDiscount = maxDiscount;

    onUpdateItem(index, { ...item, discount: newDiscount });
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = e.target.value;
    const newSizeStockInfo = item.product.sizes.find(s => s.size === newSize);
    const newSelectedSizeStock = newSizeStockInfo ? newSizeStockInfo.stock : 0;
    // Reset quantity to 1 or max available stock for the new size if current quantity exceeds it
    let newQuantity = item.quantity;
    if (newQuantity > newSelectedSizeStock) {
        newQuantity = newSelectedSizeStock > 0 ? 1 : 0; // Or Math.min(1, newSelectedSizeStock)
    }
    if(newSelectedSizeStock === 0 && newSizeStockInfo) { // If the selected size is explicitly out of stock
        newQuantity = 0;
    }


    onUpdateItem(index, { ...item, selectedSize: newSize, quantity: newQuantity });
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateItem(index, { ...item, note: e.target.value });
  };

  const finalPrice = (item.product.price * item.quantity - item.discount).toFixed(2);

  const sizeOptions = item.product.sizes.map((s: SizeStock) => ({
    value: s.size,
    label: `${s.size} (Stock: ${s.stock})`,
  }));

  return (
    <tr className={`border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 ${isOutOfStock ? 'opacity-70 bg-red-50' : ''}`}>
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{item.product.title}</td>
      <td className="px-4 py-3">
        <img src={item.product.image} alt={item.product.title} className="w-12 h-12 object-cover rounded-md" />
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{item.product.code}</td>
      <td className="px-4 py-3">
        {item.product.sizes && item.product.sizes.length > 0 ? (
          <Select
            value={item.selectedSize}
            onChange={handleSizeChange}
            options={sizeOptions}
            className="w-32 text-xs" // Increased width to accommodate stock info
            disabled={item.product.sizes.length === 0}
          />
        ) : (
          <span className="text-sm text-gray-500">-</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Input
          type="number"
          value={item.quantity}
          onChange={handleQuantityChange}
          min="0" // Allow 0 if out of stock
          max={currentSizeStock > 0 ? currentSizeStock : 0} // Max is current stock for selected size
          className="w-20 text-sm text-center"
          disabled={isOutOfStock || currentSizeStock === 0 && item.product.sizes.length > 0 }
        />
         {currentSizeStock > 0 && item.quantity >= currentSizeStock && <p className="text-xs text-orange-500 mt-1">Max stock</p>}
         {isOutOfStock && <p className="text-xs text-red-500 mt-1">Out of stock</p>}
         {item.product.sizes.length === 0 && <p className="text-xs text-gray-400 mt-1">No sizes</p>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">€{item.product.price.toFixed(2)}</td>
      <td className="px-4 py-3">
        <Input
          type="number"
          value={item.discount}
          onChange={handleDiscountChange}
          min="0"
          step="0.01"
          className="w-24 text-sm text-center"
          disabled={isOutOfStock}
        />
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-indigo-600">€{finalPrice}</td>
      <td className="px-4 py-3">
        <Input
          type="text"
          value={item.note}
          onChange={handleNoteChange}
          placeholder="Optional note..."
          className="w-full text-xs"
          disabled={isOutOfStock}
        />
      </td>
      <td className="px-4 py-3 text-center">
        <Button variant="ghost" size="sm" onClick={() => onRemoveItem(index)} aria-label="Remove item">
          <TrashIcon className="text-red-500 hover:text-red-700" />
        </Button>
      </td>
    </tr>
  );
};