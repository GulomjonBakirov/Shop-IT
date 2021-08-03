import React, { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MetaData from "../layouts/MetaData";
import Sidebar from "./Sidebar";
import { useAlert } from "react-alert";
import { useDispatch, useSelector } from "react-redux";
import {
  updateOrder,
  getOrderDetails,
  clearErrors,
} from "../../actions/orderActions";
import { UPDATE_ORDER_RESET } from "../../constants/orderConstants";
const UpdateOrder = ({ match, history }) => {
  const [status, setStatus] = useState("");

  const alert = useAlert();
  const dispatch = useDispatch();
  const { error, order } = useSelector((state) => state.orderDetails);
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    user,
    totalPrice,
    orderStatus,
  } = order;
  const {
    error: updateError,
    loading,
    isUpdated,
  } = useSelector((state) => state.orderAction);

  const shippingDetails =
    shippingInfo &&
    `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`;
  const isPaid =
    paymentInfo && paymentInfo.status === "succeeded" ? true : false;
  const orderId = match.params.id;

  useEffect(() => {
    if (order && order._id !== orderId) {
      dispatch(getOrderDetails(orderId));
    } else {
      setStatus(order.orderStatus);
    }

    if (error) {
      alert.error(error);
      dispatch(clearErrors());
    }

    if (updateError) {
      alert.error(error);
      dispatch(clearErrors());
    }
    if (isUpdated) {
      alert.success("Order status is updated successfully");
      dispatch({ type: UPDATE_ORDER_RESET });
    }
  }, [dispatch, alert, error, order, orderId, updateError, isUpdated, history]);
  const updateOrderStatus = (id) => {
    const formData = new FormData();
    formData.set("status", status);

    dispatch(updateOrder(id, formData));
  };
  return (
    <Fragment>
      <MetaData title={`Process Order # ${order && order._id}`} />
      <div className="row">
        <div className="col-12 col-md-2">
          <Sidebar />
        </div>
        <div className="col-12 col-md-10">
          <Fragment>
            <div class="row d-flex justify-content-around">
              <div class="col-12 col-lg-7 order-details">
                <h3 class="my-5">Order # {order && order._id}</h3>

                <h4 class="mb-4">Shipping Info</h4>
                <p>
                  <b>Name:</b> {user && user.name}
                </p>
                <p>
                  <b>Phone:</b> {shippingInfo && shippingInfo.phoneNo}
                </p>
                <p class="mb-4">
                  <b>Address:</b> {shippingDetails}
                </p>
                <p>
                  <b>Amount:</b> ${totalPrice}
                </p>

                <hr />

                <h4 class="my-4">Payment</h4>
                <p className={isPaid ? "greenColor" : "redColor"}>
                  <b>{isPaid ? "PAID" : "NOT PAID"}</b>
                </p>

                <h4 class="my-4">Stripe ID</h4>
                <p class="greenColor">
                  <b>{paymentInfo && paymentInfo.id}</b>
                </p>

                <h4 class="my-4">Order Status:</h4>
                <p class="greenColor">
                  <b>{orderStatus}</b>
                </p>

                <h4 class="my-4">Order Items:</h4>

                <hr />
                {orderItems &&
                  orderItems.map((item) => (
                    <div class="cart-item my-1">
                      <div class="row my-5">
                        <div class="col-4 col-lg-2">
                          <img
                            src={item.image}
                            alt={item.name}
                            height="45"
                            width="65"
                          />
                        </div>

                        <div class="col-5 col-lg-5">
                          <Link to={`/product/${item.product}`}>
                            {item.name}
                          </Link>
                        </div>

                        <div class="col-4 col-lg-2 mt-4 mt-lg-0">
                          <p>${item.price}</p>
                        </div>

                        <div class="col-4 col-lg-3 mt-4 mt-lg-0">
                          <p>{item.quantity} Piece(s)</p>
                        </div>
                      </div>
                    </div>
                  ))}
                <hr />
              </div>

              <div class="col-12 col-lg-3 mt-5">
                <h4 class="my-4">Status</h4>

                <div class="form-group">
                  <select
                    class="form-control"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>

                <button
                  class="btn btn-primary btn-block"
                  onClick={(e) => updateOrderStatus(order._id)}
                  disabled={loading ? true : false}
                >
                  Update Status
                </button>
              </div>
            </div>
          </Fragment>
        </div>
      </div>
    </Fragment>
  );
};

export default UpdateOrder;
