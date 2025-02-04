use happs_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
pub fn get_all_happs() -> ExternResult<Vec<Link>> {
    let path = Path::from("all_happs");
    get_links(GetLinksInputBuilder::try_new(path.path_entry_hash()?, LinkTypes::AllHapps)?.build())
}
