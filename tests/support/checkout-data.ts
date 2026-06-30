export const checkoutCustomer = {
  firstName: 'Test',
  lastName: 'Customer',
  postalCode: '10001'
} as const;

export const checkoutErrors = {
  firstNameRequired: 'Error: First Name is required',
  lastNameRequired: 'Error: Last Name is required',
  postalCodeRequired: 'Error: Postal Code is required'
} as const;
