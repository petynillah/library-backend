const { DataTypes } = require('sequelize');
const sequelize = require('./db'); // adjust to wherever your sequelize instance lives

const SsoTicket = sequelize.define('SsoTicket', {
  ticket: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true
  },
  token: {
    type: DataTypes.TEXT, // the Bearer JWT being handed off
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'sso_tickets',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['ticket'] }
  ]
});

module.exports = SsoTicket;