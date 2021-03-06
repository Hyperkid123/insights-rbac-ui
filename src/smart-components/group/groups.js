import React, { Fragment, useEffect, useState } from 'react';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import { Button, Stack, StackItem } from '@patternfly/react-core';
import AddGroupWizard from './add-group/add-group-wizard';
import EditGroup from './edit-group-modal';
import RemoveGroup from './remove-group-modal';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { createRows } from './group-table-helpers';
import { fetchGroups, fetchSystemGroup } from '../../redux/actions/group-actions';
import Group from './group';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import Section from '@redhat-cloud-services/frontend-components/Section';
import Role from '../role/role';
import GroupRowWrapper from './group-row-wrapper';
import { routes as paths } from '../../../package.json';
import './groups.scss';
import PageActionRoute from '../common/page-action-route';
import { applyPaginationToUrl, syncDefaultPaginationWithUrl } from '../../helpers/shared/pagination';
import { applyFiltersToUrl, syncDefaultFiltersWithUrl } from '../../helpers/shared/filters';
import { getBackRoute } from '../../helpers/shared/helpers';

const columns = [
  { title: 'Name', key: 'name', transforms: [sortable] },
  { title: 'Roles' },
  { title: 'Members' },
  { title: 'Last modified', key: 'modified', transforms: [sortable] },
];

const Groups = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const fetchData = (options) => dispatch(fetchGroups({ ...options, inModal: false }));

  const { groups, meta, filters, userIdentity, isLoading } = useSelector(
    ({ groupReducer: { groups, isLoading, systemGroup } }) => ({
      groups: [
        ...(systemGroup?.name?.match(new RegExp(groups.filters.name, 'i')) ? [systemGroup] : []),
        ...(groups?.data?.filter(({ platform_default } = {}) => !platform_default) || []),
      ],
      meta: groups.pagination || groups.meta,
      filters: groups.filters,
      userIdentity: groups.identity,
      isLoading,
      systemGroup,
    }),
    shallowEqual
  );

  const [pagination, setPagination] = useState(meta);
  const [filterValue, setFilterValue] = useState(filters.name || '');
  const [selectedRows, setSelectedRows] = useState([]);
  const [removeGroupsList, setRemoveGroupsList] = useState([]);

  useEffect(() => {
    const syncedPagination = syncDefaultPaginationWithUrl(history, pagination);
    setPagination(syncedPagination);
    const { name } = syncDefaultFiltersWithUrl(history, ['name'], { name: filterValue });
    setFilterValue(name);
    insights.chrome.appNavClick({ id: 'groups', secondaryNav: true });
    fetchData({ ...syncedPagination, filters: { name } });
    dispatch(fetchSystemGroup(name));
  }, []);

  const setCheckedItems = (newSelection) => {
    setSelectedRows((rows) =>
      newSelection(rows)
        .filter(({ platform_default: isPlatformDefault }) => !isPlatformDefault)
        .map(({ uuid, name }) => ({ uuid, label: name }))
    );
  };

  useEffect(() => {
    pagination.redirected && applyPaginationToUrl(history, pagination.limit, pagination.offset);
  }, [pagination.redirected]);

  useEffect(() => {
    setFilterValue(filters.name);
    setPagination(meta);
  }, [filters, meta]);

  const routes = () => (
    <Fragment>
      <Route exact path={paths['add-group']}>
        <AddGroupWizard
          pagination={pagination}
          filters={filters}
          postMethod={(config) => {
            fetchData(config);
            setFilterValue('');
          }}
        />
      </Route>
      <Route exact path={paths['group-edit'].path}>
        <EditGroup
          pagination={pagination}
          filters={filters}
          postMethod={(config) => {
            fetchData(config);
          }}
          cancelRoute={getBackRoute(paths.groups, pagination, filters)}
          submitRoute={getBackRoute(paths.groups, { ...pagination, offset: 0 }, filters)}
        />
      </Route>
      <Route exact path={paths['remove-group']}>
        <RemoveGroup
          pagination={pagination}
          filters={filters}
          postMethod={(ids, config) => {
            fetchData(config);
            setSelectedRows(selectedRows.filter((row) => !ids.includes(row.uuid)));
          }}
          cancelRoute={getBackRoute(paths.groups, pagination, filters)}
          submitRoute={getBackRoute(paths.groups, { ...pagination, offset: 0 }, filters)}
          isModalOpen
          groupsUuid={removeGroupsList}
        />
      </Route>
    </Fragment>
  );

  const actionResolver = ({ isPlatformDefault }) =>
    isPlatformDefault || !(userIdentity && userIdentity.user && userIdentity.user.is_org_admin)
      ? null
      : [
          {
            title: 'Edit',
            onClick: (_event, _rowId, group) => {
              history.push(`/groups/edit/${group.uuid}`);
            },
          },
          {
            title: 'Delete',
            onClick: (_event, _rowId, group) => {
              setRemoveGroupsList([group]);
              history.push(paths['remove-group']);
            },
          },
        ];

  // TODO check this later
  const toolbarButtons = () => [
    ...(userIdentity && userIdentity.user && userIdentity.user.is_org_admin
      ? [
          <Link to={paths['add-group']} key="add-group" className="ins-m-hide-on-sm">
            <Button ouiaId="create-group-button" variant="primary" aria-label="Create group">
              Create group
            </Button>
          </Link>,
          {
            label: 'Create group',
            props: {
              className: 'pf-m-hidden-on-md',
            },
            onClick: () => {
              history.push(paths['add-group']);
            },
          },
          {
            label: 'Edit',
            props: {
              isDisabled: !(selectedRows.length === 1),
            },
            onClick: () => history.push(`/groups/edit/${selectedRows[0].uuid}`),
          },
          {
            label: 'Delete',
            props: {
              isDisabled: !selectedRows.length > 0,
            },
            onClick: () => {
              setRemoveGroupsList(selectedRows);
              history.push(paths['remove-group']);
            },
          },
        ]
      : []),
  ];

  const renderGroupsList = () => (
    <Stack className="ins-c-rbac__groups">
      <StackItem>
        <TopToolbar paddingBottom>
          <TopToolbarTitle title="Groups" />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id={'tab-groups'}>
          <TableToolbarView
            data={groups.map((group) => (group.platform_default ? { ...group, principalCount: 'All' } : group))}
            createRows={createRows}
            columns={columns}
            isSelectable={userIdentity && userIdentity.user && userIdentity.user.is_org_admin}
            checkedRows={selectedRows}
            setCheckedItems={setCheckedItems}
            routes={routes}
            actionResolver={actionResolver}
            titlePlural="groups"
            titleSingular="group"
            ouiaId="groups-table"
            pagination={pagination}
            filterValue={filterValue}
            fetchData={(config) => {
              const { name, count, limit, offset, orderBy } = config;
              applyPaginationToUrl(history, limit, offset);
              applyFiltersToUrl(history, { name });
              return fetchData({ count, limit, offset, orderBy, filters: { name } });
            }}
            setFilterValue={({ name }) => setFilterValue(name)}
            toolbarButtons={toolbarButtons}
            isLoading={isLoading}
            filterPlaceholder="name"
            rowWrapper={GroupRowWrapper}
            tableId="groups"
          />
        </Section>
      </StackItem>
    </Stack>
  );
  return (
    <Switch>
      <PageActionRoute pageAction="role-detail" path={paths['group-detail-role-detail']} render={(props) => <Role {...props} />} />
      <PageActionRoute
        pageAction="group-detail"
        path={paths['group-detail']}
        render={(props) => <Group {...props} onDelete={() => setFilterValue('')} />}
      />
      <PageActionRoute pageAction="group-list" path={paths.groups} render={() => renderGroupsList()} />
    </Switch>
  );
};

export default Groups;
