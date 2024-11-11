import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import listGroups from '@redhat-cloud-services/rbac-client/dist/ListGroups';
import { AxiosResponse } from 'axios';

const groupApi = APIFactory('/api/rbac/v1', {
  listGroups,
});

type GroupResponse = AxiosResponse<{
  data: {
    uuid: string;
    name: string;
  }[];
}>;

export const search = async (query: string) => {
  const {
    data: { data },
  } = (await groupApi.listGroups({
    name: query,
    limit: 10,
  })) as unknown as GroupResponse;
  return data.map(({ uuid, name }) => ({ description: `The group: ${name}`, title: name, href: `/iam/user-access/groups/detail/${uuid}` }));
};
