create database alumni;



create table users (
    user_id BIGSERIAL PRIMARY KEY NOT NULL,
    username varchar(255) NOT NULL unique,
    first_name varchar(30) NOT NULL,
    last_name varchar(30),
    phone BIGINT unique NOT NULL,
    email varchar unique NOT NULL,
    user_password varchar(255) NOT NULL,
    is_alumni boolean,
    is_verified boolean,
    passout_year int,
    created_at timestamp,
    updated_at timestamp,
    otp varchar(1000)
    
);

create table companies(
    company_id BIGSERIAL PRIMARY KEY NOT NULL,
    company_name varchar NOT NULL
);


create table user_profile(
    profile_id BIGSERIAL PRIMARY KEY NOT NULL,
    fk_user int,
    fk_university_id int,
    profile_image varchar,
    profile_background_image varchar,
    about_me varchar,
    git_profile varchar,
    linkedin varchar,
    user_resume varchar,
    portfolio varchar,
    experience varchar,
    suggestion varchar,
    otp varchar(1000),
    followers int default 0,
    instagram varchar,
    constraint fk_user FOREIGN KEY(fk_user) references users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    constraint fk_university_id FOREIGN KEY(fk_university_id) references university(university_id) ON DELETE CASCADE ON UPDATE CASCADE
);

create table user_companies(
    user_company_id BIGSERIAL PRIMARY KEY NOT NULL,
    fk_company_id int,
    fk_user int,
    job_role varchar,
    contribution varchar,
    Begin_Date varchar,
    last_Date varchar,
    constraint fk_user FOREIGN KEY(fk_user) references user_profile(profile_id) ON DELETE CASCADE ON UPDATE CASCADE,
    constraint fk_company_id FOREIGN KEY(fk_company_id) references companies(company_id) ON DELETE CASCADE ON UPDATE CASCADE
);

create table domain(
    domain_id BIGSERIAL PRIMARY KEY NOT NULL,
    domain_name varchar NOT NULL
);
create table user_domain (
    user_domain_id BIGSERIAL PRIMARY KEY NOT NULL,
    fk_user int,
    fk_domain_id int,
    constraint fk_user FOREIGN KEY(fk_user)  references user_profile(profile_id) ON DELETE CASCADE ON UPDATE CASCADE,
    constraint fk_domain_id FOREIGN KEY(fk_domain_id) references domain(domain_id) ON DELETE CASCADE ON UPDATE CASCADE
);

create table university(
    university_id BIGSERIAL NOT NULL PRIMARY KEY,
    university_name varchar NOT NULL

);

create table user_university (
    user_university_id BIGSERIAL PRIMARY KEY NOT NULL,
    fk_user int,
    fk_university_id int,
    location varchar,
    start_year varchar,
    end_year varchar,
    education varchar,
    constraint fk_user FOREIGN KEY(fk_user)  references user_profile(profile_id) ON DELETE CASCADE ON UPDATE CASCADE,
    constraint fk_university_id FOREIGN KEY (fk_university_id) references university(university_id) ON DELETE CASCADE ON UPDATE CASCADE
);


create table skills(
    skill_id BIGSERIAL NOT NULL PRIMARY KEY,
    skill_name varchar NOT NUll
);

create table user_skills(
    user_skills_id BIGSERIAL PRIMARY KEY NOT NULL,
    fk_user int,
    fk_skill_id int,
    constraint fk_user FOREIGN KEY(fk_user)  references user_profile(profile_id) ON DELETE CASCADE ON UPDATE CASCADE,
    constraint fk_skill_id FOREIGN KEY(fk_skill_id) references skills(skill_id) ON DELETE CASCADE ON UPDATE CASCADE
);


create table followers(
    fk_follower_id int,
    fk_following_id int,
    constraint fk_follower_id FOREIGN KEY(fk_follower_id) references user_profile(profile_id) ON DELETE CASCADE ON UPDATE CASCADE,
    constraint fk_following_id FOREIGN KEY(fk_following_id) references user_profile(profile_id) ON DELETE CASCADE ON UPDATE CASCADE
);


create table posts(
    posts_id BIGSERIAL NOT NULL PRIMARY KEY,
    fk_user int,
    fk_domain_id int,
    title varchar ,       --Allow user to post without title?
    content varchar NOT NULL,
    likes int NOT NULL,
    link varchar,
    created_at timestamp DEFAULT NOW(), 
    constraint fk_user FOREIGN KEY(fk_user) references user_profile(profile_id) ON DELETE CASCADE ON UPDATE CASCADE,
    constraint fk_domain_id FOREIGN KEY(fk_domain_id) references domain(domain_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(posts_id),
    FOREIGN KEY (user_id) REFERENCES user_profile(profile_id)
);

CREATE TABLE bookmarks (
    bookmark_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profile(profile_id),
    FOREIGN KEY (post_id) REFERENCES posts (posts_id)
);

create table bookmark_post(
    _bookmark_postid BIGSERIAL NOT NULL PRIMARY KEY,
    fk_post int,  -- name change from db diagram
    fk_user int,
    constraint fk_user FOREIGN KEY(fk_user) references user_profile(profile_id) ON DELETE CASCADE ON UPDATE CASCADE,
    constraint fk_post FOREIGN KEY(fk_post) references posts(posts_id) ON DELETE CASCADE ON UPDATE CASCADE
);

create table comments(
    comments_id BIGSERIAL NOT NULL PRIMARY KEY,
    fk_post int,
    fk_user int,
    comment varchar NOT NULL,
    parent_id int,
    created_at timestamp,
    constraint fk_user FOREIGN KEY(fk_user) references user_profile(profile_id) ON DELETE CASCADE ON UPDATE CASCADE,
    constraint fk_post FOREIGN KEY(fk_post) references posts(posts_id) ON DELETE CASCADE ON UPDATE CASCADE,
    constraint parent_id FOREIGN KEY(parent_id) references comments(comments_id) ON DELETE CASCADE ON UPDATE CASCADE
);

create table messages(
    messages_id BIGSERIAL NOT NULL PRIMARY KEY,
    sender_id int,
    reciever_id int,
    msg_content varchar NOT NULL, --name changed from db-diagram
    sent_at timestamp,
    seen_at timestamp,
    constraint fk_sender FOREIGN KEY(sender_id) references user_profile(profile_id) ON DELETE CASCADE ON UPDATE CASCADE,
    constraint fk_reciever FOREIGN KEY(reciever_id) references user_profile(profile_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE feedback (
    feedback_id BIGSERIAL NOT NULL PRIMARY KEY,
    fk_user INT,
    content VARCHAR(255) NOT NULL,
    stars INT,
    CONSTRAINT fk_user FOREIGN KEY(fk_user) REFERENCES user_profile(profile_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


create table user_token(
    user_token_id BIGSERIAL NOT NULL PRIMARY KEY,
    fk_user int,
    token varchar,
    is_valid boolean,
    created_at timestamp,
    updated_at timestamp,
    constraint fk_user FOREIGN KEY(fk_user) references users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

create table sso_tokens(
    sso_tokens_id BIGSERIAL NOT NULL PRIMARY KEY, --name change
    fk_user int,
    token varchar,
    constraint fk_user FOREIGN KEY(fk_user) references users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

create table admin_table(
    admin_id BIGSERIAL NOT NULL PRIMARY KEY,
    username varchar NOT NULL unique,
    email varchar NOT NULL unique,
    admin_password varchar NOT NULL,  -- name change
    created_at timestamp,
    updated_at timestamp
);

create table admin_token(
    admin_token_id BIGSERIAL NOT NULL PRIMARY KEY,
    fk_admin int,
    token varchar,
    created_at timestamp,  --defualt current_timestamp  or timezone default current_timestamp
    updated_at timestamp,
    constraint fk_admin FOREIGN KEY(fk_admin) references admin_table(admin_id) ON DELETE CASCADE ON UPDATE CASCADE
);

create table work(
    work_id BIGSERIAL NOT NULL PRIMARY KEY,
    work_type text,
    fk_user_id int,
    company_name text,
    job_role text,
    address_ text,
    requirements text,
    tag text[],
    link_to_apply text,
    posted_at timestamp,
    constraint fk_user_id FOREIGN KEY (fk_user_id) references user_profile(profile_id) ON DELETE CASCADE ON UPDATE CASCADE 
);
