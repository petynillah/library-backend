const { DataTypes } = require('sequelize');
const sequelize = require('./database'); // Replace with your actual sequelize connection path

const TrustedDevice = sequelize.define('TrustedDevice', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  device_token: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  staff_id: {
    type: DataTypes.INTEGER, // Must match the data type of your StaffUser model primary key
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  }
}, {
  tableName: 'trusted_devices',
  timestamps: true, // Automatically provides createdAt and updatedAt
});

module.exports = TrustedDevice;
