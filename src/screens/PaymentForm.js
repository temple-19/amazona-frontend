import React, { useContext, useEffect, useReducer, useState } from 'react';
import './paymentForm.css';
import axios from 'axios';
import { getError } from '../utilis';
import { toast } from 'react-toastify';
import { Store } from '../Store';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingBox from '../components/LoadingBox';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, order: action.payload, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

const PaymentForm = () => {
  const { state } = useContext(Store);
  const { cart, userInfo } = state;
  const params = useParams();
  const { id: orderId } = params;
  const [{ loading, error, order }, dispatch] = useReducer(reducer, {
    loading: true,
    error: '',
    order: {},
  });
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_REQUEST' });
      try {
        const { data } = await axios.get(
          `https://amazona-api-hfe1.onrender.com/api/orders/${orderId}`,
          {},
          { headers: { Authorization: `Bearer ${userInfo.token}` } }
        );
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (error) {
        dispatch({
          type: 'FETCH_FAIL',
          payload: getError(error),
        });
      }
    };
    fetchData();
  }, [userInfo]);

  // console.log(cart, userInfo, orderId, order.totalPrice);
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`https://amazona-api-hfe1.onrender.com/api/proxy`, {
        cardName: event.target.name.value,
        number: `${event.target.cardNumber.value}`,
        expiry_month: `${event.target.expiryMonth.value}`,
        expiry_year: `${event.target.expiryYear.value}`,
        cvd: `${event.target.cvd.value}`,
        billingName: cart.shippingAddress.fullName,
        billingAddress: cart.shippingAddress.address,
        billingCity: cart.shippingAddress.city,
        // billingCountry: cart.shippingAddress.country,
        billingPostalCode: cart.shippingAddress.postalCode,
        billingEmail: userInfo.email,
        amount: order.totalPrice,
      });
      console.log(response.data);
      if (response.data.approved === '1') {
        // Payment successful
        const data = await axios.put(
          `https://amazona-api-hfe1.onrender.com/api/orders/${order._id}/pay`,
          {
            headers: {
              authorization: `Bearer ${userInfo.token}`,
            },
          }
        );
        navigate(`/order/${orderId}`);
        toast.success('Order is paid');
      } else {
        // Payment failed
        toast.error('Failed, use a valid card');
      }
    } catch (err) {
      toast(getError(err));
    } finally {
      setIsLoading(false); // Set loading state back to false
    }
  };
  return (
    <div>
      {order.isPaid ? (
        <div className="payment-completed">
          <p>Payment has already been completed for this order.</p>
          <a href="/">Go to Home</a>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit}>
          {/* Render the loading spinner if isLoading is true */}
          {isLoading ? (
            <LoadingBox /> // Replace with your loading spinner component
          ) : (
            <div className="credit-card-form">
              {/* Render the form inputs */}
              <input type="text" name="name" placeholder="Cardholder Name" />
              <input type="text" name="cardNumber" placeholder="Card Number" />
              <div className="input-container">
                <input
                  type="text"
                  name="expiryMonth"
                  placeholder="Expiry Month"
                />
                <input
                  type="text"
                  name="expiryYear"
                  placeholder="Expiry Year"
                />
                <input type="text" name="cvd" placeholder="CVD" />
              </div>
              <button type="submit">Pay</button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default PaymentForm;
