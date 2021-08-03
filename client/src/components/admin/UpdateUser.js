import React, { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MetaData from "../layouts/MetaData";
import Sidebar from "./Sidebar";
import { useAlert } from "react-alert";
import { useDispatch, useSelector } from "react-redux";
import {
  getUserDetails,
  updateUser,
  clearErrors,
} from "../../actions/userActions";
import { UPDATE_USER_RESET } from "../../constants/userConstants";
import Loader from "../layouts/Loader";
const UpdateUser = ({ match, history }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const alert = useAlert();
  const dispatch = useDispatch();
  const {
    error,
    loading: userDetailLoding,
    user,
  } = useSelector((state) => state.userDetails);
  const {
    error: updateError,
    loading,
    isUpdated,
  } = useSelector((state) => state.userAction);
  const userId = match.params.id;

  useEffect(() => {
    if (user && user._id !== userId) {
      dispatch(getUserDetails(userId));
    } else {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
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
      alert.success("User is updated successfully");
      history.push("/admin/users");
      dispatch({ type: UPDATE_USER_RESET });
    }
  }, [dispatch, alert, error, user, userId, updateError, isUpdated, history]);
  const submitHandler = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("email", email);
    formData.set("role", role);

    dispatch(updateUser(user._id, formData));
  };
  return (
    <Fragment>
      <MetaData title={`Update User # ${user && user._id}`} />
      <div className="row">
        <div className="col-12 col-md-2">
          <Sidebar />
        </div>
        <div className="col-12 col-md-10">
          {userDetailLoding ? (
            <Loader />
          ) : (
            <Fragment>
              <div class="row wrapper">
                <div class="col-10 col-lg-5">
                  <form class="shadow-lg" onSubmit={submitHandler}>
                    <h1 class="mt-2 mb-5">Update User</h1>

                    <div class="form-group">
                      <label for="name_field">Name</label>
                      <input
                        type="name"
                        id="name_field"
                        class="form-control"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div class="form-group">
                      <label for="email_field">Email</label>
                      <input
                        type="email"
                        id="email_field"
                        class="form-control"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div class="form-group">
                      <label for="role_field">Role</label>

                      <select
                        id="role_field"
                        class="form-control"
                        name="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      class="btn update-btn btn-block mt-4 mb-3"
                      disabled={loading ? true : false}
                    >
                      Update
                    </button>
                  </form>
                </div>
              </div>
            </Fragment>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export default UpdateUser;
