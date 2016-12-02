#!/usr/bin/env python
#  -*- coding: utf-8 -*-
import argparse
import logging
import os
import sys
from importlib import import_module

from pymongo import MongoClient

root = logging.getLogger()
root.setLevel(logging.DEBUG)

ch = logging.StreamHandler(sys.stdout)
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
ch.setFormatter(formatter)
root.addHandler(ch)


class Migrations(object):
    def __init__(self, connection_string=None):
        self.client = MongoClient(connection_string)
        self.db = self.client.get_database('itsyouonline-idserver-db')
        self.migration_collection = self.db.get_collection('migrations')

    def get_current_migration_version(self):
        migration_object = self.migration_collection.find_one({'_id': 'control'})
        if not migration_object:
            return 0
        if migration_object['locked']:
            raise Exception(
                'Cannot migrate, control is locked. Perhaps another server/process is executing migrations?')
        return migration_object['version']

    def write_current_migration(self, version, locked=False):
        self.migration_collection.update_one({
            '_id': 'control'
        }, {
            '$set': {
                'version': version,
                'locked': locked,
            }
        }, upsert=True)

    @staticmethod
    def get_migrations():
        migrations = []
        latest_migration = 0
        for migration_file_name in os.listdir('migrations'):
            if 'migration_' in migration_file_name and '.pyc' not in migration_file_name:
                version = int(migration_file_name.replace('.py', '').split('migration_')[1])
                migrations.append(version)
                if latest_migration < version:
                    latest_migration = version
        return sorted(migrations), latest_migration

    def run_migrations(self):
        logging.info('Checking if migrations need to be run...')
        migrations, latest_version = self.get_migrations()
        current_migration_version = self.get_current_migration_version()
        if current_migration_version < latest_version:
            logging.info('Starting migrations from version %d to %d', current_migration_version, latest_version)
            self.write_current_migration(current_migration_version, locked=True)
            for migration in migrations:
                if migration > current_migration_version:
                    try:
                        self.migrate(migration)
                    except Exception as e:
                        self.write_current_migration(migration - 1, locked=False)
                        raise
                    self.write_current_migration(migration, locked=True)
            self.write_current_migration(latest_version, locked=False)
            logging.info('Done migrating.')
        else:
            logging.info('Not migrating, already at version %d' % latest_version)

    def migrate(self, version):
        logging.info('Migrating to version %d' % version)
        module = import_module('migrations.migration_%d' % version)
        module.migrate_up(self.db)
        logging.info('Migration %d finished' % version)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--connection_string', help='Mongodb connection string')
    args = parser.parse_args()
    Migrations(args.connection_string).run_migrations()
