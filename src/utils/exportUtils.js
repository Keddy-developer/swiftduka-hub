/**
 * CSV Export Utility
 * Handles conversion of JSON arrays to CSV and triggers browser download
 */

export const exportToCSV = (data, filename, headers) => {
    if (!data || !data.length) return;

    // Use headers if provided, otherwise extract from the first object keys
    const head = headers || Object.keys(data[0]);
    
    const csvContent = [
        head.join(','), // header row
        ...data.map(row => 
            head.map(fieldName => {
                let value = row[fieldName];
                
                // Handle nested objects (like product.name)
                if (fieldName.includes('.')) {
                    value = fieldName.split('.').reduce((acc, part) => acc && acc[part], row);
                }

                // Format values for CSV
                if (value === null || value === undefined) {
                    value = '';
                } else if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                
                // Escape quotes and wrap in quotes if it contains commas
                const stringValue = String(value).replace(/"/g, '""');
                return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') 
                    ? `"${stringValue}"` 
                    : stringValue;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
