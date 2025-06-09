
import React from 'react';
import PermissionGate from './PermissionGate';

const withPermission = (Component, route) => {
  return function PermissionWrappedComponent(props) {
    return (
      <PermissionGate route={route}>
        <Component {...props} />
      </PermissionGate>
    );
  };
};

export default withPermission;
